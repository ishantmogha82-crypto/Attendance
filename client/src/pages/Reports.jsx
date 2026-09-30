import { useEffect, useState } from "react";
import { Download, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../services/api";
import { CardSkeleton, EmptyState } from "../components/StateHelpers";

const PIE_COLORS = ["#1FBF9C", "#F0475A"];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports").then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  function exportReport() {
    if (!data) return;
    const header = "Student,Roll Number,Class,Days Present (30d),Percentage\n";
    const rows = data.perStudent
      .map((r) => `"${r.name}","${r.roll_number}","${r.class_section}",${r.days_present},${r.percentage}%`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "attendance_report.csv";
    link.click();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const presentPct = data?.monthlyPresentAveragePercentage ?? 0;
  const pieData = [
    { name: "Present", value: presentPct },
    { name: "Absent", value: 100 - presentPct },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-sm text-slate-400">Daily, weekly, and monthly attendance trends.</p>
        </div>
        <button onClick={exportReport} className="btn-secondary">
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
            Last 7 Days Attendance
          </h2>
          {data?.last7Days?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="present" fill="#3366FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={BarChart3} title="Not enough data yet" description="Attendance charts will appear once records are marked." />
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
            30-Day Present vs Absent
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-mint-500" /> Present {presentPct}%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-coral-500" /> Absent {100 - presentPct}%</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
          Student-wise Attendance (last 30 days)
        </h2>
        {data?.perStudent?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                  <th className="py-2.5 pr-4">Student</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Days Present</th>
                  <th className="py-2.5 pr-4">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-ink-800">
                {data.perStudent.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">{r.name}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{r.class_section}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{r.days_present}/30</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
                          <div className="h-full bg-brand-500" style={{ width: `${r.percentage}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{r.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={BarChart3} title="No students yet" />
        )}
      </div>
    </div>
  );
}
