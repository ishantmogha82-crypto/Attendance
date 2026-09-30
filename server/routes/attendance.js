const express = require("express");
const db = require("../database/db");
const { requireAuth } = require("../middleware/auth");
const { ApiError } = require("../middleware/errors");

const router = express.Router();
router.use(requireAuth);

function todayParts() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);
  return { date, time };
}

// GET /api/attendance  -- list with filters/search/pagination
router.get("/", (req, res, next) => {
  try {
    const {
      search,
      date,
      class_section,
      status,
      page = 1,
      pageSize = 20,
      sortBy = "date",
      sortDir = "desc",
    } = req.query;

    const allowedSort = ["date", "time", "name", "status", "recognition_confidence"];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : "date";
    const dir = sortDir === "asc" ? "ASC" : "DESC";

    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += " AND (s.name LIKE ? OR s.roll_number LIKE ? OR s.student_id LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (date) {
      where += " AND a.date = ?";
      params.push(date);
    }
    if (class_section) {
      where += " AND s.class_section = ?";
      params.push(class_section);
    }
    if (status) {
      where += " AND a.status = ?";
      params.push(status);
    }

    const orderCol = sortCol === "name" ? "s.name" : `a.${sortCol}`;

    const countRow = db
      .prepare(
        `SELECT COUNT(*) AS c FROM attendance a JOIN students s ON s.id = a.student_id ${where}`
      )
      .get(...params);

    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const rows = db
      .prepare(
        `SELECT a.id, a.date, a.time, a.status, a.recognition_confidence,
                s.id as student_pk, s.name, s.roll_number, s.student_id, s.class_section
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         ${where}
         ORDER BY ${orderCol} ${dir}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    res.json({
      records: rows,
      total: countRow.c,
      page: Number(page),
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(countRow.c / limit)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/today
router.get("/today", (req, res, next) => {
  try {
    const { date } = todayParts();
    const rows = db
      .prepare(
        `SELECT a.id, a.time, a.status, a.recognition_confidence, s.name, s.roll_number, s.student_id
         FROM attendance a JOIN students s ON s.id = a.student_id
         WHERE a.date = ? ORDER BY a.time DESC`
      )
      .all(date);

    const totalStudents = db
      .prepare("SELECT COUNT(*) AS c FROM students")
      .get().c;

    res.json({
      date,
      present: rows.length,
      absent: Math.max(totalStudents - rows.length, 0),
      totalStudents,
      attendancePercentage:
        totalStudents > 0 ? Math.round((rows.length / totalStudents) * 100) : 0,
      records: rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance  -- mark attendance after a confident client-side match
router.post("/", (req, res, next) => {
  try {
    const { student_id, confidence } = req.body || {};
    if (!student_id) throw new ApiError(400, "student_id is required.");

    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(student_id);
    if (!student) throw new ApiError(404, "Student not found.");
    if (student.consent_status !== "granted" || !student.face_descriptor) {
      throw new ApiError(400, "This student has not completed consented face registration.");
    }

    const threshold = Number(
      db.prepare("SELECT value FROM settings WHERE key = 'match_threshold'").get()?.value ??
        0.5
    );
    if (typeof confidence === "number" && confidence < 1 - threshold) {
      // confidence passed in as similarity (0-1); guard against low-confidence writes
      throw new ApiError(400, "Match confidence is below the configured threshold.");
    }

    const { date, time } = todayParts();

    const already = db
      .prepare("SELECT * FROM attendance WHERE student_id = ? AND date = ?")
      .get(student_id, date);

    if (already) {
      return res.status(200).json({
        alreadyMarked: true,
        message: "Already marked today.",
        record: already,
      });
    }

    const info = db
      .prepare(
        `INSERT INTO attendance (student_id, date, time, status, recognition_confidence)
         VALUES (?, ?, ?, 'present', ?)`
      )
      .run(student_id, date, time, confidence ?? null);

    const record = db.prepare("SELECT * FROM attendance WHERE id = ?").get(info.lastInsertRowid);

    res.status(201).json({
      alreadyMarked: false,
      message: `Attendance marked at ${time}`,
      record,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/export.csv
router.get("/export/csv", (req, res, next) => {
  try {
    const { date, class_section } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (date) {
      where += " AND a.date = ?";
      params.push(date);
    }
    if (class_section) {
      where += " AND s.class_section = ?";
      params.push(class_section);
    }

    const rows = db
      .prepare(
        `SELECT s.name, s.roll_number, s.student_id, s.class_section, a.date, a.time, a.status, a.recognition_confidence
         FROM attendance a JOIN students s ON s.id = a.student_id ${where}
         ORDER BY a.date DESC, a.time DESC`
      )
      .all(...params);

    const header = "Name,Roll Number,Student ID,Class/Section,Date,Time,Status,Confidence\n";
    const csvEscape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = rows
      .map((r) =>
        [
          r.name,
          r.roll_number,
          r.student_id,
          r.class_section,
          r.date,
          r.time,
          r.status,
          r.recognition_confidence ?? "",
        ]
          .map(csvEscape)
          .join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="attendance_export.csv"`);
    res.send(header + body);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
