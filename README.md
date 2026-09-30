# Attendance AI — Face Recognition Attendance System

A full-stack demo application that uses the browser's camera and client-side
face recognition (face-api.js) to recognize **previously registered, consenting**
students and mark their attendance automatically.

> **This is an educational/demo project.** It only ever recognizes people who
> have explicitly registered with consent. It never stores raw video, never
> tries to identify strangers, and every biometric record can be deleted at
> any time from the Students page.

---

## 1. Features

- Live camera-based face detection & recognition, running entirely in the browser
- Consent-gated student registration with 5-sample face capture
- Automatic attendance marking with a configurable confidence threshold
- Duplicate-attendance prevention (one record per student per day)
- Dashboard with live stats and recent recognition activity
- Searchable, filterable, sortable, paginated attendance table with CSV export
- Student management (add/edit/delete, re-register face, delete biometric data)
- Reports with daily/weekly/monthly charts and per-student percentages
- Configurable settings (recognition threshold, camera, session duration, theme)
- Admin login (JWT-based), rate-limited, protected API routes
- Demo data (3 fictional students) so the UI works immediately

## 2. Tech Stack

| Layer          | Technology                                            |
|----------------|--------------------------------------------------------|
| Frontend       | React 18, Vite, Tailwind CSS, React Router, Recharts, lucide-react |
| Face AI        | [@vladmandic/face-api](https://github.com/vladmandic/face-api) (TensorFlow.js, runs in-browser) |
| Backend        | Node.js, Express.js                                    |
| Database       | SQLite (better-sqlite3) — structured to migrate to PostgreSQL/Supabase later |
| Auth           | JWT + bcrypt                                            |

No paid API keys are required.

---

## 3. Project Structure

```
attendance-ai/
├── client/                  React frontend (Vite)
│   ├── public/models/       Face-api.js model weight files (already included)
│   └── src/
│       ├── components/      Shared UI (AppShell, Modal, StatCard, ...)
│       ├── pages/           Login, Dashboard, CameraAttendance, RegisterStudent, ...
│       ├── hooks/           useAuth, useCamera, useFaceModels
│       ├── services/        api.js (axios client)
│       └── utils/           faceMatch.js (descriptor matching)
├── server/                  Express backend
│   ├── routes/               auth, students, attendance, reports, settings
│   ├── middleware/           auth (JWT), error handling
│   ├── database/             db.js (schema + init), seed.js (demo students)
│   └── server.js
└── README.md
```

---

## 4. Installation

### Prerequisites
- Node.js 18+ and npm

### Steps

```bash
# from the project root
cd attendance-ai

# install server dependencies
cd server
npm install

# install client dependencies
cd ../client
npm install
```

## 5. Environment Variables

**server/.env** (copy from `server/.env.example`):

```
PORT=5000
JWT_SECRET=replace_this_with_a_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
CLIENT_ORIGIN=http://localhost:5173
DEFAULT_MATCH_THRESHOLD=0.5
```

> Change `JWT_SECRET` and `ADMIN_PASSWORD` before any real deployment.
> The default admin account is only created once, the first time the server
> starts and no admin exists yet.

**client/.env** (copy from `client/.env.example`):

```
VITE_API_URL=http://localhost:5000/api
```

## 6. Database Setup

The SQLite database and schema are created automatically the first time the
server starts (file created at `server/database/data/attendance.db`).

To load 3 clearly-labeled DEMO students (metadata only — no face data, so
they can't be recognized until you register a face for them):

```bash
cd server
npm run seed
```

## 7. AI Model Files

Model files are already included at `client/public/models/`:
- `tiny_face_detector_model-weights_manifest.json` + `.bin`
- `face_landmark_68_model-weights_manifest.json` + `.bin`
- `face_recognition_model-weights_manifest.json` + `.bin`

If you ever need to re-download them, get them from the
[`@vladmandic/face-api` model folder](https://github.com/vladmandic/face-api/tree/master/model)
and place them in `client/public/models/`.

## 8. Running the Application

Open two terminals.

**Terminal 1 — backend:**
```bash
cd server
npm run dev        # starts on http://localhost:5000
```

**Terminal 2 — frontend:**
```bash
cd client
npm run dev         # starts on http://localhost:5173
```

Visit `http://localhost:5173` and log in with the admin credentials from
`server/.env` (default: `admin` / `ChangeMe123!`).

## 9. Camera Permissions

The browser will prompt for camera access the first time you open the
**Take Attendance** or **Register Student** page. You must allow it for
recognition to work.

- If you previously denied access, re-enable it via your browser's site
  settings (usually the padlock/info icon in the address bar → Permissions
  → Camera → Allow), then reload the page.
- If multiple cameras are connected, a camera picker appears once permission
  is granted.
- Camera streams are stopped automatically when you leave the page, press
  **Stop Camera**, or close the tab — nothing runs in the background.

## 10. Registering a Student

1. Go to **Register Student**, fill in Student ID, name, roll number, class,
   optional email → **Save & Continue**.
2. Check the consent box confirming the student (or guardian) has agreed to
   face registration.
3. Start the camera and click **Capture Sample** 5 times, facing the camera
   from slightly different angles each time.
4. Click **Finish Registration**. Only a 128-number face descriptor is
   stored — no images or video are saved.

## 11. Marking Attendance

1. Go to **Take Attendance**, click **Start Camera**.
2. Have a registered student look at the camera. The right panel walks
   through: "Looking for a face..." → "Face detected" → "Recognizing..." →
   "✓ [Name] recognized" → "✓ Attendance marked at HH:MM".
3. If the same student is seen again the same day, it shows "Already marked
   today" and does not create a duplicate record.
4. Unrecognized faces show "Unknown person — please register first" — the
   app never guesses.

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| "Camera permission is required" | Allow camera access in browser site settings, reload |
| "No camera detected" | Check the camera is connected and not in use by another app |
| "AI model failed to load" | Confirm files exist in `client/public/models/`; check the browser console/network tab for 404s |
| Recognition is too strict / too loose | Adjust the **Match distance threshold** on the Settings page (lower = stricter) |
| "Already marked today" appears immediately | Attendance was already recorded for that student today — this is expected behavior |
| 401 errors / redirected to login | Your session expired (12h) — log in again |
| CORS errors in browser console | Make sure `CLIENT_ORIGIN` in `server/.env` matches the URL the frontend is served from |

## 13. Privacy Considerations

- Only students who complete the consent + capture flow can be recognized.
- No raw camera video or images are ever stored — only a 128-number face
  descriptor (a mathematical representation, not reversible into an image
  in any practical sense for this demo's purposes).
- Biometric data can be deleted at any time from the Students page without
  deleting the student's attendance history.
- Admin routes are protected by JWT; all inputs are validated and sanitized
  server-side.
- This project is a teaching/demo tool. For real institutional deployment
  you would want stronger biometric protections, encryption at rest, formal
  data retention policies, and legal review appropriate to your
  jurisdiction's biometric privacy laws.

## 14. Production Deployment Notes

- Swap SQLite for PostgreSQL/Supabase by replacing `server/database/db.js`
  with an equivalent client (the schema maps directly to Postgres types).
- Set strong, unique values for `JWT_SECRET` and `ADMIN_PASSWORD`.
- Serve the client as a static build (`npm run build` in `client/`) behind a
  CDN or reverse proxy, and run the API behind HTTPS.
- Restrict `CLIENT_ORIGIN` to your real production domain.
- Consider moving face descriptor storage/matching to the server if you need
  centralized control, though this demo intentionally keeps recognition
  client-side for privacy and simplicity.

## 15. Common Errors & Fixes

- **`EADDRINUSE` on server start** — another process is already using port
  5000; change `PORT` in `server/.env`.
- **`better-sqlite3` fails to install** — you may need build tools
  (`python3`, `make`, a C++ compiler) on your OS; on Debian/Ubuntu:
  `sudo apt install build-essential python3`.
- **Blank camera preview** — some browsers block camera access on non-HTTPS
  origins other than `localhost`; use `localhost` during development.
- **CSV export downloads an empty file** — no records match your current
  filters; clear the date/status filters and try again.
