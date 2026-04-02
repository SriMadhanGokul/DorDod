import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBan,
  FaTrash,
  FaCheck,
  FaEnvelope,
  FaCalendar,
} from "react-icons/fa";

export default function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    api
      .get(`/admin/users/${id}`)
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSuspend = async () => {
    try {
      await api.patch(`/admin/users/${id}/suspend`);
      setData((p: any) => ({
        ...p,
        user: { ...p.user, suspended: !p.user.suspended },
      }));
      toast.success("User status updated!");
    } catch {
      toast.error("Failed");
    }
  };

  const deleteUser = async () => {
    if (!confirm("Delete this user and ALL their data?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted!");
      navigate("/admin/users");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  if (!data)
    return (
      <AdminLayout>
        <div className="text-center py-24 text-gray-400">User not found</div>
      </AdminLayout>
    );

  const { user, goals, habits, achievements, skillPath, enrollments, posts } =
    data;
  const tabs = [
    "overview",
    "goals",
    "habits",
    "skills",
    "courses",
    "achievements",
    "posts",
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/users")}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaArrowLeft />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleSuspend}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${user.suspended ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"}`}
            >
              {user.suspended ? (
                <>
                  <FaCheck /> Activate
                </>
              ) : (
                <>
                  <FaBan /> Suspend
                </>
              )}
            </button>
            <button
              onClick={deleteUser}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-medium"
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>

        {/* User card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p className="font-medium flex items-center gap-1">
                  <FaEnvelope className="text-gray-400 w-3 h-3" />
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Joined</p>
                <p className="font-medium flex items-center gap-1">
                  <FaCalendar className="text-gray-400 w-3 h-3" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Subscription</p>
                <p className="font-medium">{user.subscription || "Free"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Status</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.suspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                >
                  {user.suspended ? "Suspended" : "Active"}
                </span>
              </div>
              {user.suspendedReason && (
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs">Suspend Reason</p>
                  <p className="text-red-500 text-xs">{user.suspendedReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Goals", val: goals?.length || 0 },
            { label: "Habits", val: habits?.length || 0 },
            { label: "Courses", val: enrollments?.length || 0 },
            { label: "Achievements", val: achievements?.length || 0 },
            { label: "Posts", val: posts?.length || 0 },
            { label: "Skills", val: skillPath?.skills?.length || 0 },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-3 text-center"
            >
              <p className="text-xl font-bold text-gray-800">{s.val}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {tab === "overview" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Career Path</h3>
              <p className="text-sm text-gray-600">
                {skillPath?.careerPath || "Not selected"}
              </p>
              {user.bio && (
                <>
                  <h3 className="font-semibold text-gray-700 mt-4">Bio</h3>
                  <p className="text-sm text-gray-600">{user.bio}</p>
                </>
              )}
            </div>
          )}

          {tab === "goals" && (
            <div className="space-y-2">
              {goals?.length === 0 ? (
                <p className="text-gray-400 text-sm">No goals</p>
              ) : (
                goals?.map((g: any) => (
                  <div
                    key={g._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {g.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {g.category} · {g.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">
                        {g.progress}%
                      </p>
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-500 rounded-full h-1.5"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "habits" && (
            <div className="space-y-2">
              {habits?.length === 0 ? (
                <p className="text-gray-400 text-sm">No habits</p>
              ) : (
                habits?.map((h: any) => (
                  <div key={h._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium text-gray-800">
                        {h.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {h.days.filter(Boolean).length}/21 days
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {h.days.map((d: boolean, i: number) => (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded text-xs flex items-center justify-center ${d ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "skills" && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Path: {skillPath?.careerPath || "Not selected"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {skillPath?.skills?.map((s: any) => (
                  <div
                    key={s._id}
                    className={`p-2 rounded-lg text-xs font-medium border ${s.status === "learned" ? "bg-green-50 text-green-700 border-green-200" : s.status === "learning" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                  >
                    {s.name} <span className="opacity-60">({s.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "courses" && (
            <div className="space-y-2">
              {enrollments?.length === 0 ? (
                <p className="text-gray-400 text-sm">No enrollments</p>
              ) : (
                enrollments?.map((e: any) => (
                  <div
                    key={e._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {e.course?.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {e.course?.category}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.progress === 100 ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {e.progress}%
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "achievements" && (
            <div className="grid grid-cols-2 gap-3">
              {achievements?.length === 0 ? (
                <p className="text-gray-400 text-sm">No achievements</p>
              ) : (
                achievements?.map((a: any) => (
                  <div
                    key={a._id}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <p className="text-sm font-medium text-gray-800">
                      🏆 {a.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(a.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "posts" && (
            <div className="space-y-2">
              {posts?.length === 0 ? (
                <p className="text-gray-400 text-sm">No posts</p>
              ) : (
                posts?.map((p: any) => (
                  <div key={p._id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-800">{p.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(p.createdAt).toLocaleDateString()} ·{" "}
                      {p.likes?.length || 0} likes
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
