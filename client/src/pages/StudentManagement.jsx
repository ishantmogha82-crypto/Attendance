import { useEffect, useState } from "react";
import { Search, Pencil, Trash2, ShieldOff, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import Modal from "../components/Modal";
import { TableSkeleton, EmptyState } from "../components/StateHelpers";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/students", { params: { search } });
      setStudents(data.students);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await api.put(`/students/${editing.id}`, editing);
      toast.success("Student updated.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed.");
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/students/${deleting.id}`);
      toast.success("Student deleted.");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed.");
    }
  }

  async function revokeFace(student) {
    try {
      await api.delete(`/students/${student.id}/face`);
      toast.success("Biometric data deleted.");
      load();
    } catch (err) {
      toast.error("Could not delete biometric data.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Students</h1>
          <p className="text-sm text-slate-400">Manage registered students and their biometric consent.</p>
        </div>
        <Link to="/register" className="btn-primary">
          <UserPlus size={16} /> Add Student
        </Link>
      </div>

      <div className="card p-4">
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, roll no, or student ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description="Add your first student to start registering faces."
            action={
              <Link to="/register" className="btn-primary">
                <UserPlus size={16} /> Add Student
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-ink-700">
                  <th className="py-2.5 pr-4">Name</th>
                  <th className="py-2.5 pr-4">Roll No.</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Registration</th>
                  <th className="py-2.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-ink-800">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                          {s.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.student_id}</p>
                        </div>
                        {s.is_demo ? (
                          <span className="badge bg-amber-500/10 text-amber-600">DEMO</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{s.roll_number}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{s.class_section}</td>
                    <td className="py-3 pr-4">
                      {s.is_registered ? (
                        <span className="badge bg-mint-500/10 text-mint-600">Registered</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-500 dark:bg-ink-800">Not registered</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-1.5">
                        {s.is_registered && (
                          <button
                            title="Delete biometric data"
                            onClick={() => revokeFace(s)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-coral-500 dark:hover:bg-ink-800"
                          >
                            <ShieldOff size={16} />
                          </button>
                        )}
                        <button
                          title="Edit"
                          onClick={() => setEditing(s)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-brand-500 dark:hover:bg-ink-800"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => setDeleting(s)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-coral-500 dark:hover:bg-ink-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Student"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" form="edit-form" type="submit">Save changes</button>
          </>
        }
      >
        {editing && (
          <form id="edit-form" onSubmit={saveEdit} className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Roll Number</label>
              <input className="input" value={editing.roll_number} onChange={(e) => setEditing({ ...editing, roll_number: e.target.value })} required />
            </div>
            <div>
              <label className="label">Class / Section</label>
              <input className="input" value={editing.class_section} onChange={(e) => setEditing({ ...editing, class_section: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete student?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn-danger" onClick={confirmDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          This permanently removes <span className="font-semibold">{deleting?.name}</span> and all
          associated attendance records and biometric data. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
