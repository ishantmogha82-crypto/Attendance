import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera as CameraIcon,
  Video,
  VideoOff,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  UserX,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useCamera } from "../hooks/useCamera";
import { useFaceModels, faceapi } from "../hooks/useFaceModels";
import { findBestMatch } from "../utils/faceMatch";

// UI phase machine for the right-hand recognition panel
const PHASES = {
  IDLE: "idle",
  LOOKING: "looking",
  DETECTED: "detected",
  RECOGNIZING: "recognizing",
  SUCCESS: "success",
  ALREADY: "already",
  UNKNOWN: "unknown",
};

export default function CameraAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);
  const lastMarkedRef = useRef(new Set()); // student ids already marked this session, avoids duplicate API calls

  const { status, error, devices, deviceId, start, stop, switchDevice } = useCamera(videoRef);
  const { ready: modelsReady, error: modelError } = useFaceModels();

  const [threshold, setThreshold] = useState(0.5);
  const [knownStudents, setKnownStudents] = useState([]);
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [activeStudent, setActiveStudent] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Start the camera to begin.");
  const [multipleFaces, setMultipleFaces] = useState(false);

  // Load settings + registered (consented) student descriptors once
  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      const t = parseFloat(data.settings.match_threshold);
      if (!Number.isNaN(t)) setThreshold(t);
    });
    api.get("/students/internal/descriptors").then(({ data }) => {
      setKnownStudents(data.students);
    });
  }, []);

  const stopEverything = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    stop();
    setPhase(PHASES.IDLE);
    setStatusMessage("Camera stopped.");
    setActiveStudent(null);
  }, [stop]);

  // Pause the recognition loop (not the stream) when the tab is hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && loopRef.current) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      } else if (!document.hidden && status === "granted" && modelsReady && !loopRef.current) {
        loopRef.current = setInterval(runDetectionCycle, 700);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, modelsReady]);

  useEffect(() => () => stopEverything(), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function runDetectionCycle() {
    if (busyRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    busyRef.current = true;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      drawOverlay(detections);

      if (detections.length === 0) {
        setPhase(PHASES.LOOKING);
        setStatusMessage("Looking for a face...");
        setActiveStudent(null);
        setMultipleFaces(false);
        return;
      }

      if (detections.length > 1) {
        setMultipleFaces(true);
        setPhase(PHASES.DETECTED);
        setStatusMessage("Multiple faces detected — please ensure only one person is in frame.");
        return;
      }
      setMultipleFaces(false);

      setPhase(PHASES.DETECTED);
      setStatusMessage("Face detected. Recognizing...");

      const descriptor = detections[0].descriptor;
      const { student, confidence, isMatch } = findBestMatch(descriptor, knownStudents, threshold);

      if (!isMatch) {
        setPhase(PHASES.UNKNOWN);
        setStatusMessage("Unknown person — please register first.");
        setActiveStudent(null);
        return;
      }

      setPhase(PHASES.RECOGNIZING);
      setActiveStudent({ ...student, confidence });

      if (lastMarkedRef.current.has(student.id)) {
        setPhase(PHASES.ALREADY);
        setStatusMessage("Already marked today.");
        return;
      }

      const { data } = await api.post("/attendance", {
        student_id: student.id,
        confidence,
      });

      lastMarkedRef.current.add(student.id);

      if (data.alreadyMarked) {
        setPhase(PHASES.ALREADY);
        setStatusMessage("Already marked today.");
      } else {
        setPhase(PHASES.SUCCESS);
        setStatusMessage(`Attendance marked at ${data.record.time}`);
        toast.success(`✓ ${student.name} recognized`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      busyRef.current = false;
    }
  }

  function drawOverlay(detections) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detections.forEach((d) => {
      const { x, y, width, height } = d.detection.box;
      ctx.strokeStyle = "#3ED9B8";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
    });
  }

  async function handleStart() {
    if (!modelsReady) {
      toast.error("AI models are still loading. Please wait a moment.");
      return;
    }
    await start(deviceId);
    setPhase(PHASES.LOOKING);
    setStatusMessage("Looking for a face...");
    lastMarkedRef.current = new Set();
    loopRef.current = setInterval(runDetectionCycle, 700);
  }

  const phaseConfig = {
    [PHASES.IDLE]: { icon: CameraIcon, color: "text-slate-400", bg: "bg-slate-50 dark:bg-ink-800" },
    [PHASES.LOOKING]: { icon: Loader2, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-900/30", spin: true },
    [PHASES.DETECTED]: { icon: Loader2, color: "text-amber-500", bg: "bg-amber-500/10", spin: true },
    [PHASES.RECOGNIZING]: { icon: Loader2, color: "text-amber-500", bg: "bg-amber-500/10", spin: true },
    [PHASES.SUCCESS]: { icon: CheckCircle2, color: "text-mint-600", bg: "bg-mint-500/10" },
    [PHASES.ALREADY]: { icon: ShieldCheck, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-900/30" },
    [PHASES.UNKNOWN]: { icon: UserX, color: "text-coral-500", bg: "bg-coral-500/10" },
  };
  const PhaseIcon = phaseConfig[phase]?.icon || CameraIcon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Take Attendance</h1>
        <p className="text-sm text-slate-400">Look at the camera to be recognized and marked present.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* LEFT: camera */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="relative aspect-video w-full bg-ink-950">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ transform: "scaleX(-1)" }}
            />

            {status !== "granted" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white">
                {status === "denied" && (
                  <>
                    <AlertTriangle className="text-coral-400" size={32} />
                    <p className="max-w-xs text-sm">
                      Camera permission is required for attendance recognition. Enable it in your
                      browser's site settings and reload the page.
                    </p>
                  </>
                )}
                {status === "unavailable" && (
                  <>
                    <VideoOff className="text-coral-400" size={32} />
                    <p className="max-w-xs text-sm">{error || "No camera detected."}</p>
                  </>
                )}
                {(status === "idle" || status === "stopped") && (
                  <>
                    <CameraIcon size={32} className="text-slate-400" />
                    <p className="max-w-xs text-sm text-slate-300">
                      {modelsReady ? "Camera is off." : "Loading AI recognition models..."}
                    </p>
                  </>
                )}
                {status === "requesting" && (
                  <>
                    <Loader2 size={28} className="animate-spin text-brand-400" />
                    <p className="text-sm text-slate-300">Requesting camera permission...</p>
                  </>
                )}
              </div>
            )}

            {multipleFaces && status === "granted" && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white">
                <AlertTriangle size={13} /> Multiple faces
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-ink-700">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "granted" ? "bg-mint-500 animate-pulse" : "bg-slate-300"
                }`}
              />
              <span className="text-xs font-medium text-slate-500">
                {status === "granted" ? "Camera active" : "Camera inactive"}
              </span>
              {devices.length > 1 && status === "granted" && (
                <select
                  className="input ml-2 max-w-[180px] py-1.5 text-xs"
                  value={deviceId || ""}
                  onChange={(e) => switchDevice(e.target.value)}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Camera"}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2">
              {status !== "granted" ? (
                <button onClick={handleStart} className="btn-primary" disabled={!modelsReady}>
                  <Video size={16} /> Start Camera
                </button>
              ) : (
                <button onClick={stopEverything} className="btn-danger">
                  <VideoOff size={16} /> Stop Camera
                </button>
              )}
            </div>
          </div>
          {modelError && <p className="px-4 pb-4 text-xs text-coral-500">{modelError}</p>}
        </div>

        {/* RIGHT: recognition panel */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Attendance Recognition
            </h2>
          </div>

          <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm dark:bg-ink-800">
            <span className="text-slate-500">
              {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <LiveClock />
          </div>

          <div
            className={`flex flex-col items-center justify-center rounded-xl2 ${phaseConfig[phase]?.bg} px-6 py-8 text-center transition-colors`}
          >
            <PhaseIcon
              size={36}
              className={`${phaseConfig[phase]?.color} ${phaseConfig[phase]?.spin ? "animate-spin" : ""}`}
            />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{statusMessage}</p>
          </div>

          {activeStudent && (
            <div className="mt-5 space-y-3 rounded-xl2 border border-slate-100 p-4 dark:border-ink-700">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-display font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                  {activeStudent.name?.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{activeStudent.name}</p>
                  <p className="text-xs text-slate-400">Roll {activeStudent.roll_number} · {activeStudent.class_section}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Match confidence</span>
                <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {Math.round((activeStudent.confidence || 0) * 100)}%
                </span>
              </div>
            </div>
          )}

          {knownStudents.length === 0 && (
            <p className="mt-5 rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs text-amber-600">
              No consented students are registered yet. Add students on the Register page before
              taking attendance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{now.toLocaleTimeString()}</span>;
}
