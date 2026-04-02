import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaBell, FaUsers, FaUser } from "react-icons/fa";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    userId: "",
    title: "",
    message: "",
    type: "info",
  });
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState<"all" | "user">("all");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/admin/notifications"),
      api.get("/admin/users?limit=100"),
    ])
      .then(([nRes, uRes]) => {
        setNotifications(nRes.data.data);
        setUsers(uRes.data.data.users);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!form.title || !form.message)
      return toast.error("Title and message required");
    if (target === "user" && !form.userId) return toast.error("Select a user");
    setSending(true);
    try {
      await api.post("/admin/notifications", {
        title: form.title,
        message: form.message,
        type: form.type,
        userId: target === "user" ? form.userId : undefined,
      });
      toast.success(
        target === "all" ? "Sent to all users!" : "Notification sent!",
      );
      setForm({ userId: "", title: "", message: "", type: "info" });
      const res = await api.get("/admin/notifications");
      setNotifications(res.data.data);
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  const typeConfig: Record<string, string> = {
    info: "bg-blue-100 text-blue-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    error: "bg-red-100 text-red-600",
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500 text-sm">
            Send global or user-specific notifications
          </p>
        </div>

        {/* Send form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaBell className="text-yellow-500" /> Send Notification
          </h2>
          <div className="space-y-3">
            {/* Target toggle */}
            <div className="flex gap-2">
              {(
                [
                  ["all", "All Users", FaUsers],
                  ["user", "Specific User", FaUser],
                ] as const
              ).map(([val, label, Icon]) => (
                <button
                  key={val}
                  onClick={() => setTarget(val)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${target === val ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>

            {target === "user" && (
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
            )}

            <input
              placeholder="Notification title *"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Message *"
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="info">ℹ️ Info</option>
              <option value="success">✅ Success</option>
              <option value="warning">⚠️ Warning</option>
              <option value="error">❌ Error</option>
            </select>
            <button
              onClick={send}
              disabled={sending}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              {sending
                ? "Sending..."
                : `Send to ${target === "all" ? "All Users" : "User"}`}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Recent Notifications ({notifications.length})
          </h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-400 text-sm">No notifications sent yet</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeConfig[n.type] || typeConfig.info}`}
                  >
                    {n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      To: {n.user?.name || "Unknown"} ·{" "}
                      {new Date(n.createdAt).toLocaleDateString()}
                      {n.global && " · 🌐 Global"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
