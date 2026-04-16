import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";


import {
  FaChartBar,
  FaUsers,
  FaBullseye,
  FaCalendarCheck,
  FaBook,
  FaUsers as FaCommunity,
  FaTrophy,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaShieldAlt,
  FaClock,
  FaLightbulb,
  FaStar,
} from "react-icons/fa";

const navItems = [
  { to: "/admin", icon: FaChartBar, label: "Dashboard", exact: true },
  { to: "/admin/users", icon: FaUsers, label: "Users" },
  { to: "/admin/goals", icon: FaBullseye, label: "Goals" },
  { to: "/admin/pending-courses", icon: FaClock, label: "Pending Courses" },
  { to: "/admin/user-skills", icon: FaLightbulb, label: "User Skills" },
  { to: "/admin/habits", icon: FaCalendarCheck, label: "Habits" },
  { to: "/admin/xp", icon: FaStar, label: "⭐ XP & Gamification" },
  { to: "/admin/courses", icon: FaBook, label: "Courses" },
  { to: "/admin/community", icon: FaCommunity, label: "Community" },
  { to: "/admin/achievements", icon: FaTrophy, label: "Achievements" },
  { to: "/admin/notifications", icon: FaBell, label: "Notifications" },
  { to: "/admin/settings", icon: FaCog, label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-yellow-400 text-xl" />
            <div>
              <p className="font-bold text-sm">DoR-DoD</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400"
          >
            <FaTimes />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-yellow-400 text-gray-900"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-800 rounded-lg transition-all"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500"
          >
            <FaBars className="text-xl" />
          </button>
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-yellow-500" />
            <span className="font-semibold text-gray-700 hidden sm:block">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {user?.name}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
