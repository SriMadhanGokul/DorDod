import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  FaPlus,
  FaFire,
  FaTrophy,
  FaCheck,
  FaClock,
  FaLock,
  FaEdit,
  FaTrash,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
} from "react-icons/fa";

interface Routine {
  _id: string;
  name: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  category: string;
  icon: string;
  color: string;
  completedToday: boolean;
  completedAt?: string;
  inWindow: boolean;
  windowPassed: boolean;
  windowUpcoming: boolean;
  createdToday: boolean;
  streak: number;
  longestStreak: number;
  totalPoints: number;
}
interface Summary {
  total: number;
  completed: number;
  missed: number;
  todayPoints: number;
  totalPoints: number;
  weeklyPoints: number;
  totalGained: number;
  totalLost: number;
  currentPoints: number;
}
interface WeekDay {
  date: string;
  completed: number;
  total: number;
  perfect: boolean;
}

const CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Career",
  "Personal",
  "Social",
  "Other",
];
const EMOJIS = [
  "⭐",
  "💪",
  "📚",
  "🧘",
  "🎯",
  "🔥",
  "🏃",
  "✍️",
  "🎨",
  "🎵",
  "💡",
  "🌱",
  "⚡",
  "🏆",
  "🧠",
  "❤️",
];
const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
];

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function getDayLabel(dateStr: string) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(dateStr + "T00:00:00").getDay()
  ];
}

function StatCard({
  label,
  value,
  icon,
  colorClass,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${colorClass}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function RoutineModal({
  routine,
  onClose,
  onSave,
  count,
}: {
  routine?: Routine | null;
  onClose: () => void;
  onSave: () => void;
  count: number;
}) {
  const [form, setForm] = useState({
    name: routine?.name || "",
    description: routine?.description || "",
    scheduledStart: routine?.scheduledStart || "06:00",
    scheduledEnd: routine?.scheduledEnd || "07:00",
    category: routine?.category || "Personal",
    icon: routine?.icon || "⭐",
    color: routine?.color || "#6366f1",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Name required.");
    if (form.scheduledStart >= form.scheduledEnd)
      return toast.error("Start must be before end.");
    if (!routine && count >= 12) return toast.error("Max 12 habits.");
    setLoading(true);
    try {
      const tz = getTimezone();
      if (routine) {
        await api.put(`/routines/${routine._id}`, form);
        toast.success("Updated!");
      } else {
        await api.post(`/routines?timezone=${tz}`, { ...form, timezone: tz });
        toast.success("Created!");
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">
            {routine ? "Edit Habit" : "New Habit"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Morning Workout"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Description
            </label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["scheduledStart", "scheduledEnd"] as const).map((field, i) => (
              <div key={field}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  {i === 0 ? "Start Time *" : "End Time *"}
                </label>
                <input
                  type="time"
                  value={form[field]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field]: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
            ⏰ Habits added today won't receive penalties — starts from
            tomorrow.
          </p>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.category === c ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, icon: e }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === e ? "bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{ background: c }}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : routine ? "Save Changes" : "Create Habit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HabitCard({
  routine,
  onComplete,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  onComplete: (id: string) => void;
  onEdit: (r: Routine) => void;
  onDelete: (id: string) => void;
}) {
  const [doing, setDoing] = useState(false);
  const go = async () => {
    if (doing || routine.completedToday || !routine.inWindow) return;
    setDoing(true);
    await onComplete(routine._id);
    setDoing(false);
  };

  const badge = routine.completedToday ? (
    <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
      <FaCheck className="text-xs" />
      Done
    </span>
  ) : routine.windowPassed ? (
    <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
      Missed −3pts
    </span>
  ) : routine.createdToday && !routine.inWindow ? (
    <span className="text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
      Added today
    </span>
  ) : routine.inWindow ? (
    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full animate-pulse">
      ● Now
    </span>
  ) : (
    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
      Upcoming
    </span>
  );

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-all hover:shadow-md ${routine.windowPassed && !routine.completedToday ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: routine.color + "20",
            border: `2px solid ${routine.color}40`,
          }}
        >
          {routine.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                {routine.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <FaClock className="text-gray-400 text-xs" />
                <span className="text-xs text-gray-500">
                  {fmt12(routine.scheduledStart)} –{" "}
                  {fmt12(routine.scheduledEnd)}
                </span>
              </div>
            </div>
            {badge}
          </div>
          {routine.description && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {routine.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FaFire className="text-orange-400 text-xs" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {routine.streak}d
                </span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {routine.category}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEdit(routine)}
                className="text-gray-400 hover:text-indigo-500 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <FaEdit className="text-xs" />
              </button>
              <button
                onClick={() => onDelete(routine._id)}
                className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <FaTrash className="text-xs" />
              </button>
              {routine.completedToday ? (
                <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                  <FaCheck className="text-white text-sm" />
                </div>
              ) : routine.windowPassed ? (
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <FaTimes className="text-gray-400 text-sm" />
                </div>
              ) : routine.inWindow ? (
                <button
                  onClick={go}
                  disabled={doing}
                  className="w-9 h-9 rounded-full border-2 border-indigo-500 flex items-center justify-center hover:bg-indigo-500 group transition-all"
                >
                  <FaCheck className="text-indigo-500 group-hover:text-white text-sm transition-colors" />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-40">
                  <FaLock className="text-gray-400 text-xs" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitsContent() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    completed: 0,
    missed: 0,
    todayPoints: 0,
    totalPoints: 0,
    weeklyPoints: 0,
    totalGained: 0,
    totalLost: 0,
    currentPoints: 0,
  });
  const [weeklyGrid, setWeeklyGrid] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoutine, setEditRoutine] = useState<Routine | null>(null);
  const tz = getTimezone();

  const load = useCallback(async () => {
    try {
      // Always apply penalties first so missed stats reflect immediately
      try {
        await api.post("/routines/apply-penalties", { timezone: tz });
      } catch {}
      const [lr, sr] = await Promise.all([
        api.get(`/routines?timezone=${tz}`),
        api.get(`/routines/summary?timezone=${tz}`),
      ]);
      setRoutines(lr.data.routines);
      setSummary({ ...lr.data.summary, ...sr.data });
      setWeeklyGrid(sr.data.weeklyGrid || []);
    } catch {
      toast.error("Failed to load habits.");
    } finally {
      setLoading(false);
    }
  }, [tz]);

  useEffect(() => {
    load();
  }, [load]);
  // Refresh every 60s to catch newly passed windows
  useEffect(() => {
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const handleComplete = async (id: string) => {
    try {
      const { data } = await api.patch(`/routines/${id}/complete`, {
        timezone: tz,
      });
      let msg = `+5 points!`;
      if (data.dailyBonus) msg += ` +${data.dailyBonus} daily bonus! 🎉`;
      if (data.weeklyBonus) msg += ` +${data.weeklyBonus} perfect week! 🏆`;
      toast.success(msg);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this habit?")) return;
    try {
      await api.delete(`/routines/${id}`);
      toast.success("Deleted.");
      load();
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const progress =
    summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Daily Habits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => {
            setEditRoutine(null);
            setShowModal(true);
          }}
          disabled={summary.total >= 12}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          <FaPlus className="text-xs" /> Add Habit
        </button>
      </div>

      {/* 4-stat dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Current Points"
          value={summary.currentPoints}
          icon={<FaWallet />}
          colorClass="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600"
          sub="Your balance"
        />
        <StatCard
          label="Total Gained"
          value={`+${summary.totalGained}`}
          icon={<FaArrowUp />}
          colorClass="bg-green-100 dark:bg-green-900/40 text-green-600"
          sub="All time earned"
        />
        <StatCard
          label="Total Lost"
          value={`-${summary.totalLost}`}
          icon={<FaArrowDown />}
          colorClass="bg-red-100 dark:bg-red-900/40 text-red-500"
          sub="Penalties paid"
        />
        <StatCard
          label="This Week"
          value={summary.weeklyPoints}
          icon={<FaFire />}
          colorClass="bg-amber-100 dark:bg-amber-900/40 text-amber-600"
          sub="Resets Monday"
        />
      </div>

      {/* Progress bar */}
      {summary.total > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Today's Progress
            </span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-semibold">
                {summary.completed} done
              </span>
              {summary.missed > 0 && (
                <span className="text-red-500 font-semibold">
                  {summary.missed} missed
                </span>
              )}
              <span className="font-bold text-indigo-600">{progress}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: progress === 100 ? "#22c55e" : "#6366f1",
              }}
            />
          </div>
          {progress === 100 && (
            <p className="text-xs text-green-600 mt-2 font-semibold text-center">
              🎉 All done! +10 bonus earned!
            </p>
          )}
          {summary.todayPoints !== 0 && (
            <p
              className={`text-xs mt-1.5 text-center font-medium ${summary.todayPoints >= 0 ? "text-indigo-500" : "text-red-500"}`}
            >
              Today: {summary.todayPoints >= 0 ? "+" : ""}
              {summary.todayPoints} pts
            </p>
          )}
        </div>
      )}

      {/* Weekly grid */}
      {weeklyGrid.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            This Week
          </h3>
          <div className="grid grid-cols-7 gap-1.5">
            {weeklyGrid.map((day) => {
              const isToday =
                day.date === new Date().toLocaleDateString("en-CA");
              const pct = day.total > 0 ? day.completed / day.total : 0;
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={`text-xs ${isToday ? "font-bold text-indigo-600" : "text-gray-400"}`}
                  >
                    {getDayLabel(day.date)}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all
                    ${day.perfect ? "bg-green-500 text-white" : pct > 0 ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700" : isToday ? "bg-gray-100 dark:bg-gray-800 text-gray-500 ring-2 ring-indigo-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
                  >
                    {day.perfect
                      ? "✓"
                      : day.completed > 0
                        ? day.completed
                        : "·"}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Perfect week = +25 bonus 🏆
          </p>
        </div>
      )}

      {/* Habits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Your Habits ({summary.total}/12)
          </h2>
          <span className="text-xs text-gray-400">Sorted by time</span>
        </div>
        {routines.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-gray-500 text-sm">No habits yet.</p>
            <button
              onClick={() => {
                setEditRoutine(null);
                setShowModal(true);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors"
            >
              + Add First Habit
            </button>
          </div>
        ) : (
          routines.map((r) => (
            <HabitCard
              key={r._id}
              routine={r}
              onComplete={handleComplete}
              onEdit={(r) => {
                setEditRoutine(r);
                setShowModal(true);
              }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Rules */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/50">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FaTrophy className="text-amber-500" /> Points Rules
        </h3>
        <div className="space-y-2 text-xs">
          {[
            ["Complete a habit", "+5", "text-green-600"],
            ["All habits done today", "+10 bonus", "text-green-600"],
            ["Perfect week (all 7 days)", "+25 🏆", "text-amber-500"],
            ["Missed habit (window closed)", "−3", "text-red-500"],
            ["Habits added today", "No penalty", "text-blue-500"],
          ].map(([label, pts, cls]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{label}</span>
              <span className={`font-bold ${cls}`}>{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <RoutineModal
          routine={editRoutine}
          onClose={() => {
            setShowModal(false);
            setEditRoutine(null);
          }}
          onSave={load}
          count={summary.total}
        />
      )}
    </div>
  );
}

export default function HabitsPage() {
  return (
    <DashboardLayout>
      <HabitsContent />
    </DashboardLayout>
  );
}
