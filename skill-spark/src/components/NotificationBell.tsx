import { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaCheck } from "react-icons/fa";
import { api } from "@/utils/api";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

const TYPE_STYLE: Record<string, string> = {
  info: "border-l-blue-400 bg-blue-50",
  success: "border-l-green-400 bg-green-50",
  warning: "border-l-yellow-400 bg-yellow-50",
  error: "border-l-red-400 bg-red-50",
};

const TYPE_ICON: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/notifications")
      .then((r) => setNotifs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Poll for unread count every 30s
  useEffect(() => {
    const poll = () => {
      api
        .get("/notifications?unreadOnly=true")
        .then((r) => setNotifs(r.data.data || []))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-muted transition-all text-foreground-muted hover:text-foreground"
      >
        <FaBell className="text-lg" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <FaCheck className="w-2.5 h-2.5" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-foreground-muted">
                <FaBell className="text-3xl mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  className={`border-l-4 px-4 py-3 cursor-pointer hover:brightness-95 transition-all ${TYPE_STYLE[n.type]} ${!n.read ? "font-medium" : "opacity-70"}`}
                  onClick={() => markRead(n._id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">
                      {TYPE_ICON[n.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{n.title}</p>
                      <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
