import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Percent, Camera, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import StatCard from "../components/StatCard";
import { CardSkeleton, EmptyState } from "../components/StateHelpers";

export default function Dashboard() {
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/attendance/today")
      .then(({ data }) => setToday(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link to="/attendance-camera" className="btn-primary">
          <Camera size={16} /> Take Attendance
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Students" value={today?.totalStudents ?? 0} icon={Users} accent="brand" />
          <StatCard label="Present Today" value={today?.present ?? 0} icon={UserCheck} accent="mint" />
          <StatCard label="Absent Today" value={today?.absent ?? 0} icon={UserX} accent="coral" />
          <StatCard
            label="Attendance Rate"
            value={today?.attendancePercentage ?? 0}
            suffix="%"
            icon={Percent}
            accent="amber"
          />
        </div>
      )}

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Recent Recognition Activity
          </h2>
          <Link to="/records" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : today?.records?.length ? (
          <ul className="divide-y divide-slate-100 dark:divide-ink-700">
            {today.records.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-500/10 text-mint-600">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.name}</p>
                    <p className="text-xs text-slate-400">Roll {r.roll_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock size={13} /> {r.time}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Camera}
            title="No attendance marked yet today"
            description="Open the Take Attendance page to start recognizing registered students."
            action={
              <Link to="/attendance-camera" className="btn-primary">
                <Camera size={16} /> Take Attendance
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
