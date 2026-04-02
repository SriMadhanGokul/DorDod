import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaTrash, FaTrophy, FaSearch } from "react-icons/fa";

export default function AchievementsManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [allAchs, setAllAchs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    title: "",
    description: "",
    type: "Other",
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, aRes] = await Promise.all([
          api.get("/admin/users?limit=200"),
          api.get("/admin/goals?status=Completed"), // get completed goals to show achievements
        ]);
        setUsers(uRes.data.data.users);
        // Load all users' achievements by fetching from each user
        // Instead we'll show completed goals as achievements here
        setAllAchs(aRes.data.data);
      } catch {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const add = async () => {
    if (!form.userId || !form.title)
      return toast.error("User and title required");
    setSaving(true);
    try {
      await api.post("/admin/achievements", form);
      toast.success("Achievement added!");
      setShowModal(false);
      setForm({ userId: "", title: "", description: "", type: "Other" });
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const filtered = allAchs.filter((a) => {
    const matchSearch =
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchUser = !filterUser || a.user?._id === filterUser;
    return matchSearch && matchUser;
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Achievements Management
            </h1>
            <p className="text-gray-500 text-sm">
              Showing {filtered.length} completed goals
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            <FaPlus /> Award Achievement
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              placeholder="Search goal / user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none min-w-[160px]"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Achievements list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border">
                No completed goals found
              </div>
            )}
            {filtered.map((a: any) => (
              <div
                key={a._id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                  <FaTrophy className="text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {a.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                      {a.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-500">{a.user?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      ✅ Completed
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      {a.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${a.priority === "High" ? "bg-red-100 text-red-600" : a.priority === "Medium" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      {a.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Award modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Award Achievement</h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <select
                  value={form.userId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, userId: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Select user *</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Achievement title *"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none min-h-[70px]"
                />
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, type: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option>Performance</option>
                  <option>Development</option>
                  <option>Other</option>
                </select>
                <button
                  onClick={add}
                  disabled={saving}
                  className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Awarding..." : "Award Achievement"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
