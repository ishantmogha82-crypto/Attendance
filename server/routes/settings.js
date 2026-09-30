const express = require("express");
const db = require("../database/db");
const { requireAuth } = require("../middleware/auth");
const { ApiError } = require("../middleware/errors");

const router = express.Router();
router.use(requireAuth);

const EDITABLE_KEYS = [
  "match_threshold",
  "detection_interval_ms",
  "session_duration_minutes",
  "prevent_duplicate_same_day",
  "theme",
];

router.get("/", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

router.put("/", (req, res, next) => {
  try {
    const updates = req.body || {};
    const stmt = db.prepare("UPDATE settings SET value = ? WHERE key = ?");
    const tx = db.transaction((entries) => {
      for (const [key, value] of entries) {
        if (!EDITABLE_KEYS.includes(key)) continue;
        stmt.run(String(value), key);
      }
    });

    if (
      "match_threshold" in updates &&
      (Number(updates.match_threshold) < 0.3 || Number(updates.match_threshold) > 0.9)
    ) {
      throw new ApiError(400, "match_threshold must be between 0.3 and 0.9.");
    }

    tx(Object.entries(updates));

    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
