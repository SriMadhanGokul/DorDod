import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FaUsers,
  FaBullseye,
  FaCalendarCheck,
  FaNewspaper,
  FaTrophy,
  FaBook,
  FaUserSlash,
  FaUserPlus,
} from "react-icons/fa";

const COLORS = [
  "#1A237E",
  "#F9A825",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <AdminLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );

  const s = data?.stats || {};

  const statCards = [
    {
      icon: FaUsers,
      label: "Total Users",
      value: s.totalUsers,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-200",
    },
    {
      icon: FaUserPlus,
      label: "New This Month",
      value: s.newUsersThisMonth,
      color: "bg-green-50 text-green-600",
      border: "border-green-200",
    },
    {
      icon: FaUserSlash,
      label: "Suspended",
      value: s.suspendedUsers,
      color: "bg-red-50 text-red-600",
      border: "border-red-200",
    },
    {
      icon: FaBullseye,
      label: "Total Goals",
      value: s.totalGoals,
      color: "bg-purple-50 text-purple-600",
      border: "border-purple-200",
    },
    {
      icon: FaCalendarCheck,
      label: "Total Habits",
      value: s.totalHabits,
      color: "bg-yellow-50 text-yellow-600",
      border: "border-yellow-200",
    },
    {
      icon: FaNewspaper,
      label: "Posts",
      value: s.totalPosts,
      color: "bg-indigo-50 text-indigo-600",
      border: "border-indigo-200",
    },
    {
      icon: FaBook,
      label: "Enrollments",
      value: s.totalEnrollments,
      color: "bg-cyan-50 text-cyan-600",
      border: "border-cyan-200",
    },
    {
      icon: FaTrophy,
      label: "Achievements",
      value: s.totalAchievements,
      color: "bg-orange-50 text-orange-600",
      border: "border-orange-200",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Platform overview and statistics
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl border ${s.border} p-4 flex items-center gap-3`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}
              >
                <s.icon className="text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {s.value ?? 0}
                </p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* User growth chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">
              User Growth (6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthlyGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip />
                <Bar dataKey="users" fill="#1A237E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Career paths pie */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">
              Career Path Distribution
            </h3>
            {data?.careerPaths?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.careerPaths}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name?.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.careerPaths.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">
                    Name
                  </th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">
                    Email
                  </th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">
                    Joined
                  </th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentUsers || []).map((u: any) => (
                  <tr
                    key={u._id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 font-medium text-gray-800">
                      {u.name}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{u.email}</td>
                    <td className="py-2 px-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.suspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                      >
                        {u.suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
