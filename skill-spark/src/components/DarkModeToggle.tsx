import { useDarkMode } from "@/hooks/useDarkMode";
import { FaSun, FaMoon } from "react-icons/fa";

export default function DarkModeToggle() {
  const { dark, toggleDark } = useDarkMode();

  return (
    <button
      onClick={toggleDark}
      className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
      style={{ background: dark ? "#1A237E" : "#E0E0E0" }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
          dark ? "left-6 bg-yellow-300" : "left-0.5 bg-white"
        }`}
      >
        {dark ? (
          <FaMoon className="w-2.5 h-2.5 text-blue-800" />
        ) : (
          <FaSun className="w-2.5 h-2.5 text-yellow-500" />
        )}
      </div>
    </button>
  );
}
