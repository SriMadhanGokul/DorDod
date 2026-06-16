import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaTimes,
  FaFire,
  FaArrowRight,
  FaTh,
  FaList,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

interface Goal {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  progress: number;
  status: string;
  duration: number;
  targetDate?: string;
  linkedHabits: any[];
  createdAt?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Career: "💼",
  Health: "🏋️",
  Finance: "💰",
  Learning: "📚",
  Personal: "🎯",
  Other: "🎯",
};

const COLORS: Record<string, string> = {
  Career: "#6366f1",
  Health: "#ec4899",
  Finance: "#f59e0b",
  Learning: "#3b82f6",
  Personal: "#8b5cf6",
  Other: "#6b7280",
};

// ✅ FIXED: UTC-based date functions (no timezone issues)
const getDateString = () => new Date().toISOString().split("T")[0];

const getDayDueDate = (goal: Goal, dayNumber: number) => {
  if (!goal.createdAt) return null;

  const start = new Date(goal.createdAt);
  const startUTC = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );

  const dueDate = new Date(startUTC);
  dueDate.setUTCDate(dueDate.getUTCDate() + dayNumber - 1);

  return dueDate.toISOString().split("T")[0];
};

const fmtDate = (d?: string) =>
  d
    ? new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

function CircleProgress({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) {
  const size = 72,
    r = 28,
    circ = 2 * Math.PI * r;
  const off = circ - (total > 0 ? completed / total : 0) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={7}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.8s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-black" style={{ color }}>
          {completed}
        </span>
        <span className="text-xs text-gray-400">/{total}</span>
      </div>
    </div>
  );
}

export default function ExecutionPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [planView, setPlanView] = useState<"list" | "grid" | "calendar">(
    "grid",
  );
  const [calMonth, setCalMonth] = useState(new Date());
  const [isRequestPending, setIsRequestPending] = useState(false); // ✅ GLOBAL REQUEST LOCK
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/goals");
        const allGoals = res.data.data || [];
        const activeGoals = allGoals.filter((g: Goal) => g.status === "active");
        setGoals(activeGoals);

        if (activeGoals.length > 0 && !selectedGoal) {
          setSelectedGoal(activeGoals[0]);
        }
      } catch (err) {
        console.error("Failed to load goals:", err);
        toast.error("Failed to load goals");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Calculate day number based on creation date and duration
  const calculateDayInfo = (goal: Goal) => {
    if (!goal.createdAt)
      return { currentDay: 1, completed: 0, total: goal.duration || 21 };

    const start = new Date(goal.createdAt);
    const now = new Date();
    const diffTime = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentDay = Math.min(diffTime + 1, goal.duration || 21);
    const completed = Math.round((goal.progress / 100) * (goal.duration || 21));
    const total = goal.duration || 21;

    return { currentDay, completed, total };
  };

  // Get status of a day
  const getDayStatus = (goal: Goal, dayNumber: number) => {
    const dueDate = getDayDueDate(goal, dayNumber);
    if (!dueDate) return "upcoming";

    const todayStr = getDateString();
    const completed = Math.round((goal.progress / 100) * (goal.duration || 21));

    if (dayNumber <= completed) return "completed";
    if (dueDate < todayStr) return "missed";
    if (dueDate === todayStr) return "today";
    return "upcoming";
  };

  // ✅ FIXED: Add request lock to prevent multiple simultaneous calls
  const completeDay = async (goalId: string, dayNumber: number) => {
    // ✅ CRITICAL: Prevent multiple simultaneous requests
    if (isRequestPending) {
      console.warn("⚠️ Request already pending, ignoring click");
      return;
    }

    const goal = goals.find((g) => g._id === goalId);
    if (!goal) return;

    const status = getDayStatus(goal, dayNumber);

    // Only allow marking today's day or past days that haven't been marked
    if (status === "upcoming") {
      const dueDate = getDayDueDate(goal, dayNumber);
      toast(
        "⏳ This day isn't due yet. Come back on " + fmtDate(dueDate) + "!",
        {
          icon: "📅",
        },
      );
      return;
    }

    if (status === "missed") {
      toast("🔒 This day has already passed and cannot be marked.", {
        icon: "⚠️",
      });
      return;
    }

    if (status === "completed") {
      toast("✅ Already completed", { icon: "✓" });
      return;
    }

    try {
      // ✅ Lock all requests
      setIsRequestPending(true);

      console.log(
        `📍 Marking day ${dayNumber} for goal ${goalId} on ${getDateString()}`,
      );
      const res = await api.patch(`/goals/${goalId}/day/${dayNumber}/complete`);

      // Update goals with response data
      setGoals((p) =>
        p.map((g) =>
          g._id === goalId ? { ...g, progress: res.data.data.progress } : g,
        ),
      );
      if (selectedGoal?._id === goalId) {
        setSelectedGoal((prev) =>
          prev ? { ...prev, progress: res.data.data.progress } : null,
        );
      }
      toast.success(res.data.message || "✅ Day marked complete!");
    } catch (e: any) {
      console.error("❌ Error:", e);
      toast.error(e.response?.data?.message || "Could not mark this day");
    } finally {
      // ✅ Unlock
      setIsRequestPending(false);
    }
  };

  // Today's focus
  const {
    currentDay: selectedCurrentDay,
    completed: selectedCompleted,
    total: selectedTotal,
  } = selectedGoal
    ? calculateDayInfo(selectedGoal)
    : { currentDay: 1, completed: 0, total: 21 };

  // Calendar days
  const calDays = () => {
    const yr = calMonth.getFullYear(),
      mo = calMonth.getMonth();
    const first = new Date(yr, mo, 1),
      last = new Date(yr, mo + 1, 0);
    const days: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(yr, mo, d));
    return days;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Execution
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track your daily actions
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-full">
          <FaFire className="text-orange-500 w-3.5 h-3.5" />
          <span className="text-sm font-bold text-orange-600">
            {goals.length} active
          </span>
        </div>
      </div>

      {/* Today's Focus */}
      {goals.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <FaCheck className="text-white w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                  Today's Focus
                </h2>
                <p className="text-xs text-gray-400">
                  One action per active goal
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {goals.map((goal) => {
              const { currentDay } = calculateDayInfo(goal);
              const status = getDayStatus(goal, currentDay);
              const isDone = status === "completed";
              const color = COLORS[goal.category] || "#6366f1";

              return (
                <div
                  key={goal._id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isDone
                      ? "bg-green-50 dark:bg-green-950/20"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${color}20` }}
                  >
                    {CATEGORY_ICONS[goal.category] || "🎯"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isDone
                          ? "line-through text-gray-400"
                          : "text-gray-800 dark:text-white"
                      }`}
                    >
                      {goal.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      Day {currentDay}/{goal.duration || 21}
                    </p>
                  </div>
                  <button
                    onClick={() => completeDay(goal._id, currentDay)}
                    disabled={
                      isDone ||
                      status === "missed" ||
                      status === "upcoming" ||
                      isRequestPending
                    } // ✅ ADD isRequestPending
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? "bg-green-500 border-green-500 cursor-default"
                        : "border-gray-300 hover:border-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                    }`}
                  >
                    {isDone ? (
                      <FaCheck className="text-white w-3.5 h-3.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Goals Overview */}
      {goals.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">
              Active Goals
            </h2>
            <a
              href="/goals"
              className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
            >
              Edit Goals <FaArrowRight className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {goals.map((goal) => {
              const { completed, total } = calculateDayInfo(goal);
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const color = COLORS[goal.category] || "#6366f1";

              return (
                <div
                  key={goal._id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${
                    selectedGoal?._id === goal._id
                      ? "border-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20"
                      : "border-gray-100 dark:border-gray-800 hover:border-indigo-200"
                  }`}
                  onClick={() =>
                    setSelectedGoal(
                      selectedGoal?._id === goal._id ? null : goal,
                    )
                  }
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">
                      {CATEGORY_ICONS[goal.category] || "🎯"}
                    </span>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {goal.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CircleProgress
                      completed={completed}
                      total={total}
                      color={color}
                    />
                    <div>
                      <p className="text-xl font-black" style={{ color }}>
                        {pct}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Day {completed} of {total}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 21-Day Plan */}
      {selectedGoal && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          {/* Plan header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">
                {CATEGORY_ICONS[selectedGoal.category] || "🎯"}
              </span>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                  {selectedGoal.title}
                </h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  In Progress
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{selectedTotal}-Day Plan</p>
              <p className="text-sm font-bold text-indigo-600">
                Day {selectedCurrentDay} of {selectedTotal}
              </p>
            </div>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">View:</span>
            <div className="flex gap-1">
              {(
                [
                  ["list", "List", FaList],
                  ["calendar", "Calendar", FaCalendarAlt],
                  ["grid", "Grid", FaTh],
                ] as const
              ).map(([v, label, Icon]) => (
                <button
                  key={v}
                  onClick={() => setPlanView(v as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    planView === v
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300"
                  }`}
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
            {/* Legend */}
            <div className="ml-auto flex gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                Done
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full inline-block" />
                Missed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full inline-block" />
                Upcoming
              </span>
            </div>
          </div>

          {/* GRID VIEW */}
          {planView === "grid" && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: selectedTotal }).map((_, i) => {
                const dayNumber = i + 1;
                const status = getDayStatus(selectedGoal, dayNumber);
                const isDone = status === "completed";
                const isMissed = status === "missed";
                const isToday = status === "today";
                const isFuture = status === "upcoming";
                const color = COLORS[selectedGoal.category] || "#6366f1";

                return (
                  <button
                    key={dayNumber}
                    onClick={() => completeDay(selectedGoal._id, dayNumber)}
                    title={
                      isDone
                        ? `Day ${dayNumber} — Completed ✓`
                        : isFuture
                          ? `Day ${dayNumber} — Available on ${fmtDate(getDayDueDate(selectedGoal, dayNumber))}`
                          : isMissed
                            ? `Day ${dayNumber} — Missed`
                            : isToday
                              ? `Day ${dayNumber} — Due today!`
                              : `Day ${dayNumber}`
                    }
                    disabled={isMissed || isFuture || isRequestPending} // ✅ ADD isRequestPending
                    className={`w-full h-9 rounded-lg flex items-center justify-center text-xs font-bold relative transition-all border disabled:cursor-not-allowed ${
                      isDone
                        ? "bg-green-500 border-green-500 text-white"
                        : isMissed
                          ? "bg-red-50 border-red-200 text-red-400"
                          : isToday
                            ? `border-2 text-white transition-all hover:scale-105`
                            : isFuture
                              ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:scale-105 disabled:opacity-50"
                    }`}
                    style={
                      isToday ? { background: color, borderColor: color } : {}
                    }
                  >
                    {isDone ? <FaCheck className="w-2.5 h-2.5" /> : dayNumber}
                    {dayNumber === selectedTotal && (
                      <span className="absolute -top-1 -right-1 text-xs">
                        🏁
                      </span>
                    )}
                    {isFuture && !isDone && (
                      <span className="absolute -top-1 -right-1 text-xs">
                        🔒
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {planView === "list" && (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {Array.from({ length: selectedTotal }).map((_, i) => {
                const dayNumber = i + 1;
                const status = getDayStatus(selectedGoal, dayNumber);
                const isDone = status === "completed";
                const isMissed = status === "missed";
                const isToday = status === "today";
                const dueDate = getDayDueDate(selectedGoal, dayNumber);

                return (
                  <div
                    key={dayNumber}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isToday
                        ? "bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-200"
                        : isDone
                          ? "bg-green-50 dark:bg-green-950/20"
                          : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <button
                      onClick={() => completeDay(selectedGoal._id, dayNumber)}
                      disabled={
                        isMissed || status === "upcoming" || isRequestPending
                      } // ✅ ADD isRequestPending
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        isDone
                          ? "bg-green-500 border-green-500"
                          : isMissed
                            ? "bg-red-100 border-red-300"
                            : "border-gray-300 hover:border-green-400"
                      }`}
                    >
                      {isDone && <FaCheck className="text-white w-2.5 h-2.5" />}
                      {isMissed && (
                        <FaTimes className="text-red-500 w-2.5 h-2.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          isDone
                            ? "line-through text-gray-400"
                            : "text-gray-800 dark:text-white"
                        }`}
                      >
                        Day {dayNumber}
                        {isToday && (
                          <span className="ml-2 bg-indigo-600 text-white px-1.5 py-0.5 rounded text-xs">
                            Today
                          </span>
                        )}
                        {dayNumber === selectedTotal && (
                          <span className="ml-1">🏁</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmtDate(dueDate)}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                        isDone
                          ? "bg-green-100 text-green-700"
                          : isMissed
                            ? "bg-red-100 text-red-600"
                            : isToday
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                      }`}
                    >
                      {isDone
                        ? "Done"
                        : isMissed
                          ? "Missed"
                          : isToday
                            ? "Today"
                            : "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* CALENDAR VIEW */}
          {planView === "calendar" && (
            <div>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() =>
                    setCalMonth(
                      new Date(
                        calMonth.getFullYear(),
                        calMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FaChevronLeft className="w-3 h-3 text-gray-500" />
                </button>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                  {calMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() =>
                    setCalMonth(
                      new Date(
                        calMonth.getFullYear(),
                        calMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FaChevronRight className="w-3 h-3 text-gray-500" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold text-gray-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calDays().map((date, i) => {
                  if (!date) return <div key={i} className="h-8" />;

                  const dateStr = date.toISOString().split("T")[0];
                  const isT = dateStr === getDateString();

                  // Find which day number matches this date
                  let status = null;
                  for (let dn = 1; dn <= selectedTotal; dn++) {
                    if (getDayDueDate(selectedGoal, dn) === dateStr) {
                      status = getDayStatus(selectedGoal, dn);
                      break;
                    }
                  }

                  return (
                    <div
                      key={i}
                      className={`h-8 flex items-center justify-center rounded-lg text-xs font-medium relative transition-all
                        ${isT ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
                        ${
                          status === "completed"
                            ? "bg-green-500 text-white"
                            : status === "missed"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                              : status === "today"
                                ? "text-indigo-700 dark:text-indigo-300 font-bold"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                      {date.getDate()}
                      {status === "completed" && (
                        <span
                          className="absolute bottom-0 right-0.5 text-white"
                          style={{ fontSize: "8px" }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-center text-green-600 font-medium mt-4">
            ⭐ Consistency is your superpower. Don't break the chain!
          </p>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-4xl mb-3">⚡</p>
          <p className="font-semibold text-gray-700 dark:text-white">
            No active goals yet
          </p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Go to Goals and activate up to 3 to start your plan
          </p>
          <button
            onClick={() => navigate("/goals")}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
          >
            Go to Goals <FaArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
