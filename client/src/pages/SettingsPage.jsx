import { useEffect, useState } from "react";
import { Save, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setSettings(data.settings));
  }, []);

  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.put("/settings", settings);
      setSettings(data.settings);
      toast.success("Settings saved.");
      document.documentElement.classList.toggle("dark", data.settings.theme === "dark");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-400">Tune recognition behavior and appearance.</p>
      </div>

      <div className="card space-y-5 p-6">
        <h2 className="font-display font-bold text-slate-800 dark:text-slate-100">Recognition</h2>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label mb-0">Match distance threshold</label>
            <span className="font-mono text-sm font-semibold text-brand-600">{settings.match_threshold}</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="0.9"
            step="0.05"
            value={settings.match_threshold}
            onChange={(e) => update("match_threshold", e.target.value)}
            className="w-full accent-brand-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Lower values require a closer facial match (stricter). Typical range: 0.4–0.6.
          </p>
        </div>

        <div>
          <label className="label">Detection interval (ms)</label>
          <input
            type="number"
            min="300"
            step="100"
            className="input"
            value={settings.detection_interval_ms}
            onChange={(e) => update("detection_interval_ms", e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">How often each camera frame is analyzed. Higher = less CPU usage.</p>
        </div>

        <div>
          <label className="label">Attendance session duration (minutes)</label>
          <input
            type="number"
            min="10"
            className="input"
            value={settings.session_duration_minutes}
            onChange={(e) => update("session_duration_minutes", e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={settings.prevent_duplicate_same_day === "true"}
            onChange={(e) => update("prevent_duplicate_same_day", String(e.target.checked))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Prevent duplicate attendance for the same student on the same day
        </label>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-display font-bold text-slate-800 dark:text-slate-100">Appearance</h2>
        <div className="flex gap-3">
          <button
            onClick={() => update("theme", "light")}
            className={`flex-1 rounded-lg border p-3 text-sm font-medium ${
              settings.theme === "light" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500"
            }`}
          >
            <Sun size={16} className="mx-auto mb-1" /> Light
          </button>
          <button
            onClick={() => update("theme", "dark")}
            className={`flex-1 rounded-lg border p-3 text-sm font-medium ${
              settings.theme === "dark" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500"
            }`}
          >
            <Moon size={16} className="mx-auto mb-1" /> Dark
          </button>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary">
        <Save size={16} /> Save Settings
      </button>
    </div>
  );
}
