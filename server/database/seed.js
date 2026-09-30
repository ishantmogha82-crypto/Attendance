// Seeds a few clearly-labeled DEMO students with NO face descriptor.
// They exist so the UI (dashboard, student list, attendance table) has
// something to show immediately. They cannot be recognized by the camera
// until someone actually registers a face for them via the Register page —
// we never fabricate or reuse a real person's face data here.
const db = require("./db");
const { v4: uuidv4 } = require("uuid");

const demoStudents = [
  {
    student_id: "STU001",
    name: "Demo Student A",
    roll_number: "R-001",
    class_section: "10-A",
    email: "demo.a@example.com",
  },
  {
    student_id: "STU002",
    name: "Demo Student B",
    roll_number: "R-002",
    class_section: "10-A",
    email: "demo.b@example.com",
  },
  {
    student_id: "STU003",
    name: "Demo Student C",
    roll_number: "R-003",
    class_section: "10-B",
    email: "demo.c@example.com",
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO students
    (id, student_id, name, roll_number, class_section, email, consent_status, is_demo)
  VALUES (@id, @student_id, @name, @roll_number, @class_section, @email, 'pending', 1)
`);

for (const s of demoStudents) {
  const exists = db
    .prepare("SELECT id FROM students WHERE student_id = ?")
    .get(s.student_id);
  if (!exists) {
    insert.run({ id: uuidv4(), ...s });
  }
}

console.log("[seed] Demo students ensured (STU001-STU003). Register faces for them via the app to test recognition.");
