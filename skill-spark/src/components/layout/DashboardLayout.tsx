import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import {
  FaChartBar,
  FaLightbulb,
  FaBullseye,
  FaCalendarCheck,
  FaBook,
  FaChartLine,
  FaUsers,
  FaUserCircle,
  FaTrophy,
  FaTasks,
  FaFileAlt,
  FaSmile,
  FaRocket,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaBell,
  FaSearch,
  FaSun,
  FaMoon,
  FaMedal,
} from "react-icons/fa";

const navItems = [
  { to: "/dashboard", icon: FaChartBar, label: "Overview" },
  { to: "/profile", icon: FaUserCircle, label: "Identity" },
  { to: "/frame-of-mind", icon: FaSmile, label: "Mind State" },
  { to: "/goals", icon: FaBullseye, label: "Intent" },
  { to: "/skills", icon: FaLightbulb, label: "Capabilities" },
  { to: "/development-plan", icon: FaRocket, label: "Growth Plan" },
  // { to: '/habits',           icon: FaCalendarCheck, label: 'Behavior' }, // HIDDEN per client req
  { to: "/execution", icon: FaTasks, label: "Execution" },
  { to: "/achievements", icon: FaTrophy, label: "Outcomes" },
  { to: "/insights", icon: FaChartLine, label: "Insights" },
  { to: "/guidance", icon: FaMedal, label: "Guidance" },
  { to: "/learning", icon: FaBook, label: "Knowledge" },
  { to: "/network", icon: FaUsers, label: "Network" },
  // { to: '/leaderboard',      icon: FaMedal,         label: 'Progress Board' }, // HIDDEN per client req
  { to: "/resources", icon: FaFileAlt, label: "Resources" },
];

// ─── Dark Mode Hook ────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("dordod-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("dordod-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("dordod-theme", "light");
    }
  }, [dark]);

  return { dark, toggleDark: () => setDark((d) => !d) };
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      api
        .get("/notifications")
        .then((r) => setNotifs(r.data.data || []))
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    const poll = () =>
      api
        .get("/notifications?unreadOnly=true")
        .then((r) => setNotifs(r.data.data || []))
        .catch(() => {});
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs((p) => p.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const TYPE_STYLE: Record<string, string> = {
    info: "border-l-blue-400 bg-blue-50",
    success: "border-l-green-400 bg-green-50",
    warning: "border-l-yellow-400 bg-yellow-50",
    error: "border-l-red-400 bg-red-50",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-muted transition-all text-foreground-muted hover:text-foreground"
      >
        <FaBell className="text-lg" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-8 text-foreground-muted text-sm">
                No notifications
              </div>
            ) : (
              notifs.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`border-l-4 px-4 py-3 cursor-pointer hover:brightness-95 transition-all ${TYPE_STYLE[n.type] || TYPE_STYLE.info} ${!n.read ? "font-medium" : "opacity-70"}`}
                >
                  <p className="text-sm">{n.title}</p>
                  <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Global Search ────────────────────────────────────────────────────────────
function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data);
      } catch {
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const ROUTES: Record<string, string> = {
    goal: "/goals",
    course: "/learning",
    career_skill: "/skills",
    custom_skill: "/skills",
    post: "/community",
  };

  const allItems = results
    ? [
        ...results.goals,
        ...results.courses,
        ...results.skills,
        ...results.customSkills,
        ...results.posts,
      ]
    : [];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-muted hover:bg-accent px-3 py-2 rounded-xl text-sm text-foreground-muted transition-all"
      >
        <FaSearch className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Search...</span>
        <span className="hidden lg:inline text-xs bg-background border border-border px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 pt-20 p-4">
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <FaSearch className="text-foreground-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search goals, courses, skills, posts..."
            className="flex-1 bg-transparent text-foreground outline-none text-sm placeholder:text-foreground-muted"
          />
          <button
            onClick={() => {
              setOpen(false);
              setQuery("");
              setResults(null);
            }}
            className="text-xs text-foreground-muted border border-border px-2 py-1 rounded hover:bg-muted"
          >
            Esc
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && query.length < 2 && (
            <p className="text-center text-sm text-foreground-muted py-8">
              Type to search across the platform
            </p>
          )}
          {!loading && results && allItems.length === 0 && (
            <p className="text-center text-sm text-foreground-muted py-8">
              No results for "{query}"
            </p>
          )}
          {!loading &&
            allItems.map((item: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  navigate(ROUTES[item.type] || "/dashboard");
                  setOpen(false);
                  setQuery("");
                  setResults(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.title || item.name || item.skillName || item.content}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {item.type?.replace("_", " ")} ·{" "}
                    {item.category || item.status || ""}
                  </p>
                </div>
                <span className="text-xs text-foreground-muted">→</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggleDark } = useDarkMode();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg">DoR-DoD</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-foreground-muted"
          >
            <FaTimes />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:bg-muted hover:text-foreground"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-foreground-muted truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-all"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="bg-card border-b border-border px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-foreground-muted hover:text-foreground p-1"
          >
            <FaBars className="text-xl" />
          </button>

          {/* Search */}
          <div className="flex-1">
            <GlobalSearch />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0"
              style={{ background: dark ? "#1A237E" : "#E0E0E0" }}
              title={dark ? "Light mode" : "Dark mode"}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${dark ? "left-5.5 bg-yellow-300" : "left-0.5 bg-white"}`}
                style={{ left: dark ? "22px" : "2px" }}
              >
                {dark ? (
                  <FaMoon className="w-2.5 h-2.5 text-blue-800" />
                ) : (
                  <FaSun className="w-2.5 h-2.5 text-yellow-500" />
                )}
              </div>
            </button>

            {/* Notification bell */}
            <NotificationBell />

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
