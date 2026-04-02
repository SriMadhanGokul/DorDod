import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaEdit, FaTrash } from "react-icons/fa";

const CATEGORIES = [
  "Technical",
  "Leadership",
  "Soft Skills",
  "Management",
  "Innovation",
  "DevOps",
  "Data",
];

export default function CoursesManagement() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Technical",
    duration: "",
    instructor: "",
    skillTag: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/admin/courses")
      .then((r) => setCourses(r.data.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      category: "Technical",
      duration: "",
      instructor: "",
      skillTag: "",
    });
    setShowModal(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      title: c.title,
      category: c.category,
      duration: c.duration,
      instructor: c.instructor,
      skillTag: c.skillTag || "",
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title || !form.duration || !form.instructor)
      return toast.error("Fill all required fields");
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/admin/courses/${editing._id}`, form);
        setCourses((p) =>
          p.map((c) => (c._id === editing._id ? res.data.data : c)),
        );
        toast.success("Course updated!");
      } else {
        const res = await api.post("/admin/courses", form);
        setCourses((p) => [res.data.data, ...p]);
        toast.success("Course created!");
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete course "${title}"?`)) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      setCourses((p) => p.filter((c) => c._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Course Management
            </h1>
            <p className="text-gray-500 text-sm">{courses.length} courses</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            <FaPlus /> Add Course
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Title",
                  "Category",
                  "Duration",
                  "Instructor",
                  "Skill Tag",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {c.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{c.duration}</td>
                    <td className="py-3 px-4 text-gray-500">{c.instructor}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        {c.skillTag || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteCourse(c._id, c.title)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">
                  {editing ? "Edit Course" : "New Course"}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Course title *"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  placeholder="Duration (e.g. 8h) *"
                  value={form.duration}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, duration: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Instructor name *"
                  value={form.instructor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, instructor: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Skill tag (e.g. React)"
                  value={form.skillTag}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, skillTag: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update Course"
                      : "Create Course"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
