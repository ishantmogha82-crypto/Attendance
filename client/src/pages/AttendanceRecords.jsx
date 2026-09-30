import { useEffect, useState } from "react";
import { Search, Download, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import { TableSkeleton, EmptyState } from "../components/StateHelpers";

export default function AttendanceRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/attendance", {
        params: { search, date, status, page, pageSize: 10, sortBy, sortDir },
      });
      setRecords(data.records);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, date, status, page, sortBy, sortDir]);

  function toggleSort(col) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    const token = localStorage.getItem("attendance_ai_token");
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const url = `${base}/attendance/export/csv${date ? `?date=${date}` : ""}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "attendance_export.csv";
        link.click();
      });
  }

  const columns = [
    { key: "name", label: "Student" },
    { key: "roll_number", label: "Roll No." },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "status", label: "Status" },
    { key: "recognition_confidence", label: "Confidence" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Attendance Records</h1>
          <p className="text-sm text-slate-400">Search, filter, and export attendance history.</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary">
          <Download size={16} /> Download Attendance CSV
        </button>
      </div>

      <div className="card p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search student..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <input type="date" className="input w-auto" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
          <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="present">Present</option>
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : records.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No attendance records found" description="Try adjusting your filters, or mark attendance from the camera page." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                    {columns.map((c) => (
                      <th key={c.key} className="cursor-pointer select-none py-2.5 pr-4" onClick={() => toggleSort(c.key)}>
                        {c.label} {sortBy === c.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-ink-800">
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">{r.name}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{r.roll_number}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{r.date}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{r.time}</td>
                      <td className="py-3 pr-4">
                        <span className="badge bg-mint-500/10 text-mint-600 capitalize">{r.status}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-500">
                        {r.recognition_confidence ? `${Math.round(r.recognition_confidence * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button className="btn-secondary px-3 py-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <button className="btn-secondary px-3 py-1.5" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
