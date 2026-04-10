import { NavLink, useLocation } from "react-router-dom";
import {
  FaChartBar,
  FaBullseye,
  FaLightbulb,
  FaBook,
  FaCalendarCheck,
  FaChartLine,
  FaUsers,
  FaUser,
  FaTrophy,
  FaRunning,
  FaFileAlt,
  FaSmile,
  FaStar,
} from "react-icons/fa";

const navItems = [
  { to: "/dashboard", icon: FaChartBar, label: "Dashboard" },
  { to: "/skills", icon: FaLightbulb, label: "Skills" },
  { to: "/goals", icon: FaBullseye, label: "Goals" },
  { to: "/development-plan", icon: FaBook, label: "Dev Plan" },
  { to: "/habits", icon: FaCalendarCheck, label: "Habits" },
  { to: "/achievements", icon: FaTrophy, label: "Achievements" },
  { to: "/activities", icon: FaRunning, label: "Activities" },
  { to: "/learning", icon: FaBook, label: "Learning" },
  { to: "/analytics", icon: FaChartLine, label: "Analytics" },
  { to: "/community", icon: FaUsers, label: "Community" },
  { to: "/scorecard", icon: FaStar, label: "Score Card" },
  { to: "/documents", icon: FaFileAlt, label: "Documents" },
  { to: "/frame-of-mind", icon: FaSmile, label: "Frame of Mind" },
  { to: "/profile", icon: FaUser, label: "Profile" },
];

export default function DashboardSidebar() {
  const location = useLocation();
  return (
    <aside className="hidden lg:flex flex-col w-64 gradient-hero min-h-[calc(100vh-4rem)] p-4 overflow-y-auto">
      <div className="space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
