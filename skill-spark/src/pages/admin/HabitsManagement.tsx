import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaTrash, FaRedo, FaSearch, FaFilter } from "react-icons/fa";

export default function HabitsManagement() {
  const [habits, setHabits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [minDays, setMinDays] = useState(0);
  const [maxDays, setMaxDays] = useState(21);

  useEffect(() => {
    api
      .get("/admin/users?limit=200")
      .then((r) => setUsers(r.data.data.users))
      .catch(console.error);
  }, []);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      const res = await api.get(`/admin/habits?${params.toString()}`);
      setHabits(res.data.data);
    } catch {
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const reset = async (id: string) => {
    if (!confirm("Reset all days for this habit?")) return;
    try {
      const res = await api.patch(`/admin/habits/${id}/reset`);
      setHabits((p) => p.map((h) => (h._id === id ? res.data.data : h)));
      toast.success("Habit reset!");
    } catch {
      toast.error("Failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      await api.delete(`/admin/habits/${id}`);
      setHabits((p) => p.filter((h) => h._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const filtered = habits.filter((h) => {
    const completedDays = h.days.filter(Boolean).length;
    const matchSearch =
      !search ||
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchDays = completedDays >= minDays && completedDays <= maxDays;
    return matchSearch && matchDays;
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Habits Management
          </h1>
          <p className="text-gray-500 text-sm">{filtered.length} habits</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <FaFilter className="text-gray-400" /> Filters
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                placeholder="Search habit / user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
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
            <div>
              <label className="text-xs text-gray-500">
                Min days completed: {minDays}
              </label>
              <input
                type="range"
                min={0}
                max={21}
                value={minDays}
                onChange={(e) => setMinDays(+e.target.value)}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Max days completed: {maxDays}
              </label>
              <input
                type="range"
                min={0}
                max={21}
                value={maxDays}
                onChange={(e) => setMaxDays(+e.target.value)}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
          {(userId || search || minDays > 0 || maxDays < 21) && (
            <div className="flex gap-2 flex-wrap text-xs">
              {userId && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  User: {users.find((u) => u._id === userId)?.name}
                </span>
              )}
              {(minDays > 0 || maxDays < 21) && (
                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  Days: {minDays}–{maxDays}
                </span>
              )}
              <button
                onClick={() => {
                  setSearch("");
                  setUserId("");
                  setMinDays(0);
                  setMaxDays(21);
                }}
                className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full hover:bg-red-200"
              >
                ✕ Clear all
              </button>
            </div>
          )}
        </div>

        {/* Habits grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border">
            No habits found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((h) => {
              const done = h.days.filter(Boolean).length;
              const pct = Math.round((done / 21) * 100);
              return (
                <div
                  key={h._id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {h.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {h.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs text-gray-500">{h.user?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${pct === 100 ? "bg-green-100 text-green-600" : pct >= 50 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
                      >
                        {done}/21 days
                      </span>
                      <button
                        onClick={() => reset(h._id)}
                        title="Reset streak"
                        className="text-yellow-500 hover:text-yellow-700 p-1"
                      >
                        <FaRedo className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => del(h._id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Day grid */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {h.days.map((d: boolean, i: number) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${d ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`rounded-full h-1.5 transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
