import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaSearch, FaEye, FaBan, FaTrash, FaCheck } from "react-icons/fa";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/users?page=${page}&search=${search}&status=${status}`,
      );
      setUsers(res.data.data.users);
      setPages(res.data.data.pages);
      setTotal(res.data.data.total);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, status]);
  useEffect(() => {
    setPage(1);
    fetchUsers();
  }, [search]);

  const toggleSuspend = async (id: string, suspended: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/suspend`, { reason: "Admin action" });
      setUsers((p) =>
        p.map((u) => (u._id === id ? { ...u, suspended: !u.suspended } : u)),
      );
      toast.success(suspended ? "User activated!" : "User suspended!");
    } catch {
      toast.error("Failed to update user");
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (
      !confirm(
        `Delete user "${name}" and all their data? This cannot be undone.`,
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((p) => p.filter((u) => u._id !== id));
      toast.success("User deleted!");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="text-gray-500 text-sm">{total} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "suspended"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  status === s
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
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
                    "Email",
                    "Joined",
                    "Subscription",
                    "Status",
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u._id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                          {u.subscription || "Free"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.suspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                        >
                          {u.suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${u._id}`)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => toggleSuspend(u._id, u.suspended)}
                            className={`p-1 ${u.suspended ? "text-green-500 hover:text-green-700" : "text-yellow-500 hover:text-yellow-700"}`}
                            title={u.suspended ? "Activate" : "Suspend"}
                          >
                            {u.suspended ? <FaCheck /> : <FaBan />}
                          </button>
                          <button
                            onClick={() => deleteUser(u._id, u.name)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Delete"
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

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
