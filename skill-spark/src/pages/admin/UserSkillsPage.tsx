import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaSearch, FaLightbulb } from "react-icons/fa";

export default function UserSkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/admin/skills/user-submitted")
      .then((r) => setSkills(r.data.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = skills.filter(
    (s) =>
      !search ||
      s.skillName?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const statusColor = (s: string) =>
    s === "completed"
      ? "bg-green-100 text-green-600"
      : s === "current"
        ? "bg-blue-100 text-blue-600"
        : "bg-gray-100 text-gray-600";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaLightbulb className="text-yellow-500" /> User-Submitted Skills
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} custom skills from users
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              placeholder="Search by skill name or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border">
                No user skills found
              </div>
            )}
            {filtered.map((s) => (
              <div
                key={s._id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {s.skillName}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor(s.status)}`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                    {s.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {s.user?.name}
                    </p>
                    <p className="text-xs text-gray-400">{s.user?.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {s.category}
                </span>
                {s.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {s.description}
                  </p>
                )}
                {s.alreadyKnows && (
                  <p className="text-xs text-gray-400 mt-1">
                    Knows: {s.alreadyKnows}
                  </p>
                )}
                {s.wantsToLearn && (
                  <p className="text-xs text-gray-400">
                    Wants: {s.wantsToLearn}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
