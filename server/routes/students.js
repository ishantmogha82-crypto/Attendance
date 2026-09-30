const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../database/db");
const { requireAuth } = require("../middleware/auth");
const { ApiError } = require("../middleware/errors");

const router = express.Router();
router.use(requireAuth);

function sanitizeString(value, { required = false, maxLen = 200 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ApiError(400, "Missing required field.");
    return null;
  }
  const str = String(value).trim().slice(0, maxLen);
  if (required && !str) throw new ApiError(400, "Required field cannot be empty.");
  return str;
}

function toPublicStudent(row) {
  return {
    id: row.id,
    student_id: row.student_id,
    name: row.name,
    roll_number: row.roll_number,
    class_section: row.class_section,
    email: row.email,
    is_registered: Boolean(row.face_descriptor),
    sample_count: row.sample_count,
    consent_status: row.consent_status,
    is_demo: Boolean(row.is_demo),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  // NOTE: face_descriptor is intentionally never returned to the client.
}

// GET /api/students
router.get("/", (req, res, next) => {
  try {
    const { search, class_section } = req.query;
    let query = "SELECT * FROM students WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND (name LIKE ? OR student_id LIKE ? OR roll_number LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (class_section) {
      query += " AND class_section = ?";
      params.push(class_section);
    }
    query += " ORDER BY created_at DESC";

    const rows = db.prepare(query).all(...params);
    res.json({ students: rows.map(toPublicStudent) });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id  (includes descriptor list used only for in-browser matching)
router.get("/:id", (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
    if (!row) throw new ApiError(404, "Student not found.");
    res.json({ student: toPublicStudent(row) });
  } catch (err) {
    next(err);
  }
});

// GET /api/students-with-descriptors  -- used by the camera page to load matcher data
router.get("/internal/descriptors", (req, res, next) => {
  try {
    const rows = db
      .prepare(
        "SELECT id, student_id, name, roll_number, class_section, face_descriptor FROM students WHERE face_descriptor IS NOT NULL AND consent_status = 'granted'"
      )
      .all();
    res.json({
      students: rows.map((r) => ({
        id: r.id,
        student_id: r.student_id,
        name: r.name,
        roll_number: r.roll_number,
        class_section: r.class_section,
        descriptor: JSON.parse(r.face_descriptor),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/students
router.post("/", (req, res, next) => {
  try {
    const student_id = sanitizeString(req.body.student_id, { required: true, maxLen: 50 });
    const name = sanitizeString(req.body.name, { required: true, maxLen: 120 });
    const roll_number = sanitizeString(req.body.roll_number, { required: true, maxLen: 50 });
    const class_section = sanitizeString(req.body.class_section, { required: true, maxLen: 50 });
    const email = sanitizeString(req.body.email, { required: false, maxLen: 120 });

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Email address is not valid.");
    }

    const existing = db
      .prepare("SELECT id FROM students WHERE student_id = ?")
      .get(student_id);
    if (existing) throw new ApiError(409, "A student with this Student ID already exists.");

    const id = uuidv4();
    db.prepare(
      `INSERT INTO students (id, student_id, name, roll_number, class_section, email, consent_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).run(id, student_id, name, roll_number, class_section, email);

    const row = db.prepare("SELECT * FROM students WHERE id = ?").get(id);
    res.status(201).json({ student: toPublicStudent(row) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/students/:id
router.put("/:id", (req, res, next) => {
  try {
    const existing = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
    if (!existing) throw new ApiError(404, "Student not found.");

    const name = sanitizeString(req.body.name ?? existing.name, { required: true, maxLen: 120 });
    const roll_number = sanitizeString(req.body.roll_number ?? existing.roll_number, { required: true, maxLen: 50 });
    const class_section = sanitizeString(req.body.class_section ?? existing.class_section, { required: true, maxLen: 50 });
    const email = sanitizeString(req.body.email ?? existing.email, { required: false, maxLen: 120 });

    db.prepare(
      `UPDATE students SET name=?, roll_number=?, class_section=?, email=?, updated_at=datetime('now') WHERE id=?`
    ).run(name, roll_number, class_section, email, req.params.id);

    const row = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
    res.json({ student: toPublicStudent(row) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/:id
router.delete("/:id", (req, res, next) => {
  try {
    const existing = db.prepare("SELECT id FROM students WHERE id = ?").get(req.params.id);
    if (!existing) throw new ApiError(404, "Student not found.");
    db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/:id/face  -- store averaged descriptor from consented registration samples
router.post("/:id/face", (req, res, next) => {
  try {
    const existing = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
    if (!existing) throw new ApiError(404, "Student not found.");

    const { descriptors, consent } = req.body || {};
    if (!consent) {
      throw new ApiError(400, "Explicit consent is required before storing face data.");
    }
    if (!Array.isArray(descriptors) || descriptors.length < 3) {
      throw new ApiError(400, "At least 3 face samples are required for reliable registration.");
    }
    for (const d of descriptors) {
      if (!Array.isArray(d) || d.length !== 128) {
        throw new ApiError(400, "Invalid face descriptor format received from the browser.");
      }
    }

    // Average the descriptors into a single 128-d vector for storage.
    const length = 128;
    const avg = new Array(length).fill(0);
    for (const d of descriptors) {
      for (let i = 0; i < length; i++) avg[i] += d[i];
    }
    for (let i = 0; i < length; i++) avg[i] /= descriptors.length;

    db.prepare(
      `UPDATE students
       SET face_descriptor = ?, sample_count = ?, consent_status = 'granted', updated_at = datetime('now')
       WHERE id = ?`
    ).run(JSON.stringify(avg), descriptors.length, req.params.id);

    res.json({ success: true, message: "Face registered successfully." });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/:id/face -- allow revoking / deleting biometric data while keeping the student record
router.delete("/:id/face", (req, res, next) => {
  try {
    const existing = db.prepare("SELECT id FROM students WHERE id = ?").get(req.params.id);
    if (!existing) throw new ApiError(404, "Student not found.");

    db.prepare(
      `UPDATE students SET face_descriptor = NULL, sample_count = 0, consent_status = 'revoked', updated_at = datetime('now') WHERE id = ?`
    ).run(req.params.id);

    res.json({ success: true, message: "Biometric data deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
