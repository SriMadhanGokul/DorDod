import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaTrash, FaSearch, FaFilter } from "react-icons/fa";

const CATEGORIES = [
  "All",
  "Spiritual",
  "Fitness",
  "Family",
  "Career",
  "Financial",
  "Social",
  "Intellectual",
  "Other",
];
const PRIORITIES = ["All", "High", "Medium", "Low"];
const STATUSES = ["All", "Not Started", "In Progress", "Completed", "On Hold"];

export default function GoalsManagement() {
  const [goals, setGoals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    api
      .get("/admin/users?limit=200")
      .then((r) => setUsers(r.data.data.users))
      .catch(console.error);
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (status !== "All") params.set("status", status);
      if (category !== "All") params.set("category", category);
      const res = await api.get(`/admin/goals?${params.toString()}`);
      setGoals(res.data.data);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [userId, status, category]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const deleteGoal = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await api.delete(`/admin/goals/${id}`);
      setGoals((p) => p.filter((g) => g._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      const res = await api.put(`/admin/goals/${id}`, {
        progress,
        status:
          progress === 100
            ? "Completed"
            : progress > 0
              ? "In Progress"
              : "Not Started",
      });
      setGoals((p) => p.map((g) => (g._id === id ? res.data.data : g)));
    } catch {
      toast.error("Failed to update");
    }
  };

  // Client-side search + priority filter
  const filtered = goals.filter((g) => {
    const matchSearch =
      !search ||
      g.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priority === "All" || g.priority === priority;
    return matchSearch && matchPriority;
  });

  const priorityColor = (p: string) =>
    p === "High"
      ? "bg-red-100 text-red-600"
      : p === "Medium"
        ? "bg-yellow-100 text-yellow-600"
        : "bg-gray-100 text-gray-600";

  const statusColor = (s: string) =>
    s === "Completed"
      ? "bg-green-100 text-green-600"
      : s === "In Progress"
        ? "bg-blue-100 text-blue-600"
        : s === "On Hold"
          ? "bg-orange-100 text-orange-600"
          : "bg-gray-100 text-gray-600";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Goals Management</h1>
          <p className="text-gray-500 text-sm">{filtered.length} goals</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <FaFilter className="text-gray-400" /> Filters
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative col-span-2 md:col-span-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                placeholder="Search goal / user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* User filter */}
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Active filter chips */}
          <div className="flex gap-2 flex-wrap text-xs">
            {userId && (
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                User: {users.find((u) => u._id === userId)?.name}
              </span>
            )}
            {category !== "All" && (
              <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                Category: {category}
              </span>
            )}
            {priority !== "All" && (
              <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                Priority: {priority}
              </span>
            )}
            {status !== "All" && (
              <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                Status: {status}
              </span>
            )}
            {(userId ||
              category !== "All" ||
              priority !== "All" ||
              status !== "All" ||
              search) && (
              <button
                onClick={() => {
                  setSearch("");
                  setUserId("");
                  setCategory("All");
                  setPriority("All");
                  setStatus("All");
                }}
                className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full hover:bg-red-200"
              >
                ✕ Clear all
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    "User",
                    "Goal Name",
                    "Category",
                    "Priority",
                    "Status",
                    "Progress",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-3 text-gray-500 font-medium text-xs uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No goals found
                    </td>
                  </tr>
                ) : (
                  filtered.map((g) => (
                    <tr
                      key={g._id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3">
                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            {g.user?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {g.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-800 max-w-[180px]">
                        <p className="truncate">{g.title}</p>
                        {g.description && (
                          <p className="text-xs text-gray-400 truncate">
                            {g.description}
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                          {g.category}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(g.priority)}`}
                        >
                          {g.priority}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(g.status)}`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={g.progress}
                            onChange={(e) =>
                              updateProgress(g._id, +e.target.value)
                            }
                            className="w-16 accent-blue-500 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-gray-600 w-8">
                            {g.progress}%
                          </span>
                        </div>
                        <div className="w-20 bg-gray-100 rounded-full h-1 mt-1">
                          <div
                            className={`rounded-full h-1 ${g.progress === 100 ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => deleteGoal(g._id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
