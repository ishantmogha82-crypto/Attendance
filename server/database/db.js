const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "attendance.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    class_section TEXT NOT NULL,
    email TEXT,
    face_descriptor TEXT,          -- JSON array of averaged 128-d descriptor, NULL until registered
    sample_count INTEGER NOT NULL DEFAULT 0,
    consent_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'granted' | 'revoked'
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date TEXT NOT NULL,             -- YYYY-MM-DD
    time TEXT NOT NULL,             -- HH:MM:SS
    status TEXT NOT NULL DEFAULT 'present',
    recognition_confidence REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, date)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
  CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_section);
`);

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------
const defaultSettings = {
  match_threshold: process.env.DEFAULT_MATCH_THRESHOLD || "0.5",
  detection_interval_ms: "700",
  session_duration_minutes: "480",
  prevent_duplicate_same_day: "true",
  theme: "light",
};

const insertSetting = db.prepare(
  "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
);
for (const [key, value] of Object.entries(defaultSettings)) {
  insertSetting.run(key, value);
}

// ---------------------------------------------------------------------------
// Default admin account (only created if no admin exists yet)
// ---------------------------------------------------------------------------
const adminCount = db.prepare("SELECT COUNT(*) AS c FROM admins").get().c;
if (adminCount === 0) {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO admins (username, password_hash) VALUES (?, ?)"
  ).run(username, hash);
  console.log(
    `[db] Created default admin account "${username}". Set ADMIN_USERNAME/ADMIN_PASSWORD in .env to change it.`
  );
}

module.exports = db;
