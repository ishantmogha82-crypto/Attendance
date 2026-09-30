import { useEffect, useRef, useState } from "react";
import { UserPlus, Camera as CameraIcon, ShieldCheck, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useCamera } from "../hooks/useCamera";
import { useFaceModels, faceapi } from "../hooks/useFaceModels";

const SAMPLES_NEEDED = 5;

export default function RegisterStudent() {
  const [form, setForm] = useState({
    student_id: "",
    name: "",
    roll_number: "",
    class_section: "",
    email: "",
  });
  const [savingStudent, setSavingStudent] = useState(false);
  const [createdStudent, setCreatedStudent] = useState(null);
  const [consent, setConsent] = useState(false);
  const [samples, setSamples] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const videoRef = useRef(null);
  const { status, error, start, stop } = useCamera(videoRef);
  const { ready: modelsReady, error: modelError } = useFaceModels();

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreateStudent(e) {
    e.preventDefault();
    setSavingStudent(true);
    try {
      const { data } = await api.post("/students", form);
      setCreatedStudent(data.student);
      toast.success("Student details saved. Now capture face samples.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not save student.");
    } finally {
      setSavingStudent(false);
    }
  }

  async function captureSample() {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      toast.error("Camera isn't ready yet.");
      return;
    }
    setCapturing(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("No face detected. Please face the camera clearly.");
        return;
      }
      setSamples((s) => [...s, Array.from(detection.descriptor)]);
    } catch (err) {
      console.error(err);
      toast.error("Could not process this frame. Try again.");
    } finally {
      setCapturing(false);
    }
  }

  async function submitFaceData() {
    setSubmitting(true);
    try {
      await api.post(`/students/${createdStudent.id}/face`, {
        descriptors: samples,
        consent: true,
      });
      setDone(true);
      toast.success("Student registered successfully.");
      stop();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not save face data.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setForm({ student_id: "", name: "", roll_number: "", class_section: "", email: "" });
    setCreatedStudent(null);
    setConsent(false);
    setSamples([]);
    setDone(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Register Student</h1>
        <p className="text-sm text-slate-400">Add a student and capture consented face samples for recognition.</p>
      </div>

      {/* Step 1: student details */}
      {!createdStudent && (
        <form onSubmit={handleCreateStudent} className="card space-y-4 p-6">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">1</div>
            <h2 className="font-display font-bold text-slate-800 dark:text-slate-100">Student Details</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Student ID</label>
              <input className="input" required value={form.student_id} onChange={(e) => updateField("student_id", e.target.value)} placeholder="STU004" />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input className="input" required value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Roll Number</label>
              <input className="input" required value={form.roll_number} onChange={(e) => updateField("roll_number", e.target.value)} placeholder="R-004" />
            </div>
            <div>
              <label className="label">Class / Section</label>
              <input className="input" required value={form.class_section} onChange={(e) => updateField("class_section", e.target.value)} placeholder="10-A" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Email (optional)</label>
              <input type="email" className="input" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>
          <button type="submit" disabled={savingStudent} className="btn-primary">
            {savingStudent ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Save & Continue to Face Capture
          </button>
        </form>
      )}

      {/* Step 2: consent + camera capture */}
      {createdStudent && !done && (
        <div className="card space-y-5 p-6">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">2</div>
            <h2 className="font-display font-bold text-slate-800 dark:text-slate-100">Face Registration</h2>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-brand-50 p-4 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
            <ShieldCheck size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Privacy & consent notice</p>
              <p className="mt-1 text-xs leading-relaxed">
                We capture a few live face samples to compute a mathematical face descriptor — no raw
                video or images are stored. This data is used only to recognize {form.name || "this student"} for
                attendance and can be deleted at any time from the Students page. Registration requires
                explicit consent from the student (or their guardian).
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            I confirm the student (or guardian) has explicitly consented to face data registration.
          </label>

          {consent && (
            <>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl2 bg-ink-950">
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {status !== "granted" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white">
                    {status === "denied" ? (
                      <>
                        <AlertTriangle className="text-coral-400" size={28} />
                        <p className="max-w-xs text-xs">{error}</p>
                      </>
                    ) : (
                      <CameraIcon size={28} className="text-slate-400" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                    Sample {Math.min(samples.length + (samples.length < SAMPLES_NEEDED ? 1 : 0), SAMPLES_NEEDED)}/{SAMPLES_NEEDED}
                  </span>
                </div>
                <div className="flex gap-2">
                  {status !== "granted" ? (
                    <button onClick={() => start()} className="btn-secondary" disabled={!modelsReady}>
                      <CameraIcon size={16} /> Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={captureSample}
                      disabled={capturing || samples.length >= SAMPLES_NEEDED}
                      className="btn-primary"
                    >
                      {capturing ? <Loader2 size={16} className="animate-spin" /> : <CameraIcon size={16} />}
                      Capture Sample
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {Array.from({ length: SAMPLES_NEEDED }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      i < samples.length ? "bg-mint-500" : "bg-slate-100 dark:bg-ink-700"
                    }`}
                  />
                ))}
              </div>

              {modelError && <p className="text-xs text-coral-500">{modelError}</p>}

              <button
                onClick={submitFaceData}
                disabled={samples.length < SAMPLES_NEEDED || submitting}
                className="btn-primary w-full justify-center"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Finish Registration
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: success */}
      {done && (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-500/10 text-mint-600">
            <CheckCircle2 size={28} />
          </div>
          <p className="font-display text-lg font-bold text-slate-900 dark:text-white">Student registered successfully.</p>
          <p className="text-sm text-slate-400">{form.name} can now be recognized on the attendance camera page.</p>
          <button onClick={resetAll} className="btn-primary mt-2">
            <UserPlus size={16} /> Register Another Student
          </button>
        </div>
      )}
    </div>
  );
}
