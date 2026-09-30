import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Eye, EyeOff, Fingerprint, Loader2, LockKeyhole, ScanFace, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-ink-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.24) 1px, transparent 1px)", backgroundSize: "56px 56px" }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/4 h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-[30%] h-[22rem] w-[22rem] rounded-full border border-white/10" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-500 text-ink-950">
            <ScanFace size={23} strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-display text-base font-bold tracking-wide">Attendance AI</p>
            <p className="text-xs text-slate-400">ADMINISTRATION</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl py-16">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            Secure workspace access
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
            Attendance,
            <span className="mt-2 block text-mint-400">in focus.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            A clear view of your school day. Sign in to manage student records, review attendance, and keep everything moving.
          </p>

          <div className="mt-12 flex items-center gap-4 border-t border-white/15 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-mint-400">
              <Fingerprint size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold">Privacy-conscious by design</p>
              <p className="mt-1 text-xs text-slate-400">Face matching runs in the browser</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">ATTENDANCE AI <span className="px-2 text-slate-700">/</span> ADMIN PORTAL</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[25rem]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-mint-400">
              <ScanFace size={22} />
            </div>
            <div>
              <p className="font-display font-bold text-ink-950">Attendance AI</p>
              <p className="text-xs text-slate-500">Admin portal</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Administrator access</p>
            <h2 className="font-display text-3xl font-bold text-ink-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your administrator account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">Username</label>
              <div className="relative">
                <UserRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  className="input h-12 border-slate-200 pl-10 focus:border-brand-500 focus:ring-brand-100"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                <LockKeyhole size={15} className="text-slate-400" aria-hidden="true" />
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input h-12 border-slate-200 pr-11 focus:border-brand-500 focus:ring-brand-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary h-12 w-full justify-center rounded-lg bg-ink-950 shadow-none hover:bg-ink-800">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <>Sign in <ArrowUpRight size={17} /></>}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 border-t border-slate-100 pt-5">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-mint-600" />
            <p className="text-xs leading-5 text-slate-500">Your administrator session is protected and expires automatically after 12 hours.</p>
          </div>
          <p className="mt-12 text-center text-xs text-slate-400">Need access? Contact your system administrator.</p>
        </div>
      </section>
    </main>
  );
}
