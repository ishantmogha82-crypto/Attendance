import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  UserPlus,
  Users,
  ClipboardList,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ScanFace,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/attendance-camera", label: "Take Attendance", icon: Camera },
  { to: "/register", label: "Register Student", icon: UserPlus },
  { to: "/students", label: "Students", icon: Users },
  { to: "/records", label: "Attendance Records", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function AppShell({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-ink-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-ink-700 dark:bg-ink-900 lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-pop">
            <ScanFace size={20} />
          </div>
          <div>
            <p className="font-display text-base font-bold text-slate-900 dark:text-white">
              Attendance AI
            </p>
            <p className="text-xs text-slate-400">Recognition demo</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-ink-800"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-ink-700">
          <div className="mb-3 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-ink-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              {admin?.username?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {admin?.username || "Admin"}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="btn-secondary w-full justify-center"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-900 lg:hidden">
          <div className="flex items-center gap-2">
            <ScanFace size={20} className="text-brand-500" />
            <span className="font-display font-bold">Attendance AI</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        <nav className="sticky bottom-0 z-10 flex justify-around border-t border-slate-200 bg-white px-2 py-2 dark:border-ink-700 dark:bg-ink-900 lg:hidden">
          {navItems.slice(0, 5).map(({ to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-lg p-2.5 ${isActive ? "text-brand-600" : "text-slate-400"}`
              }
            >
              <Icon size={20} />
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
