const express = require("express");
const db = require("../database/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/reports  -- daily/weekly/monthly + per-student percentages
router.get("/", (req, res, next) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) AS c FROM students").get().c;

    const last7 = db
      .prepare(
        `SELECT date, COUNT(*) AS present
         FROM attendance
         WHERE date >= date('now', '-6 days')
         GROUP BY date ORDER BY date ASC`
      )
      .all()
      .map((r) => ({
        date: r.date,
        present: r.present,
        absent: Math.max(totalStudents - r.present, 0),
        percentage: totalStudents > 0 ? Math.round((r.present / totalStudents) * 100) : 0,
      }));

    const last30 = db
      .prepare(
        `SELECT date, COUNT(*) AS present
         FROM attendance
         WHERE date >= date('now', '-29 days')
         GROUP BY date ORDER BY date ASC`
      )
      .all();

    const monthlyPresentAvg =
      last30.length > 0
        ? Math.round(
            (last30.reduce((s, r) => s + r.present, 0) / last30.length / Math.max(totalStudents, 1)) * 100
          )
        : 0;

    const perStudent = db
      .prepare(
        `SELECT s.id, s.name, s.roll_number, s.class_section,
                COUNT(a.id) AS days_present
         FROM students s
         LEFT JOIN attendance a ON a.student_id = s.id AND a.date >= date('now', '-29 days')
         GROUP BY s.id
         ORDER BY s.name ASC`
      )
      .all()
      .map((r) => ({
        ...r,
        percentage: Math.round((r.days_present / 30) * 100),
      }));

    res.json({
      totalStudents,
      last7Days: last7,
      monthlyPresentAveragePercentage: monthlyPresentAvg,
      perStudent,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
