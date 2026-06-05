import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
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

interface DayActivity {
  _id: string;
  dayNumber: number;
  title: string;
  dueDate: string;
  status: "Upcoming" | "Completed" | "Missed" | "Late";
}
interface Goal {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  icon: string;
  color: string;
  dayActivities: DayActivity[];
  planStartDate?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Career: "💼",
  Fitness: "🏋️",
  Financial: "💰",
  Intellectual: "📚",
  Spiritual: "🧘",
  Family: "👨‍👩‍👧",
  Social: "🤝",
  Other: "🎯",
};

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
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
  const [backlog, setBacklog] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [planView, setPlanView] = useState<"list" | "grid" | "calendar">(
    "grid",
  );
  const [calMonth, setCalMonth] = useState(new Date());
  const location = useLocation();
  const navGoalId = (location.state as any)?.goalId || null;

  const load = async () => {
    try {
      const res = await api.get("/goals");
      const all = res.data.data || [];
      const inProg = all.filter((g: Goal) => g.status === "In Progress");
      setGoals(inProg);
      setBacklog(all.filter((g: Goal) => g.status === "Not Started"));

      if (navGoalId) {
        // Navigated from Goals page — highlight that specific goal in grid view
        const target = inProg.find((g: Goal) => g._id === navGoalId);
        if (target) {
          setSelectedGoal(target);
          setPlanView("grid");
        } else if (inProg.length > 0) setSelectedGoal(inProg[0]);
      } else if (inProg.length > 0 && !selectedGoal) {
        setSelectedGoal(inProg[0]);
      }
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const completeDay = async (goalId: string, dayNumber: number) => {
    // Check if the day is today before calling API
    const goal = goals.find((g) => g._id === goalId);
    if (goal) {
      const day = goal.dayActivities?.find(
        (d: any) => d.dayNumber === dayNumber,
      );
      if (day) {
        const todayStr = today();
        const dueStr = day.dueDate?.slice(0, 10);
        if (dueStr && dueStr > todayStr) {
          toast(
            "⏳ This day isn't due yet. Come back on " +
              new Date(dueStr + "T00:00:00").toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              }) +
              "!",
            { icon: "📅" },
          );
          return;
        }
        if (dueStr && dueStr < todayStr && day.status !== "Completed") {
          toast("🔒 This day has already passed and cannot be marked.", {
            icon: "⚠️",
          });
          return;
        }
      }
    }
    try {
      const res = await api.patch(`/goals/${goalId}/day/${dayNumber}/complete`);
      const updated = res.data.data;
      setGoals((p) => p.map((g) => (g._id === goalId ? updated : g)));
      if (selectedGoal?._id === goalId) setSelectedGoal(updated);
      toast.success(res.data.message);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Could not mark this day");
    }
  };

  const activateGoal = async (id: string) => {
    try {
      const res = await api.patch(`/goals/${id}/activate`);
      toast.success(res.data.message);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const todayFocus = goals
    .map((goal) => {
      const todayStr = today();
      const todayDay = goal.dayActivities?.find(
        (d) => d.dueDate?.slice(0, 10) === todayStr,
      );
      const nextDay = goal.dayActivities?.find((d) => d.status === "Upcoming");
      return { goal, day: todayDay || nextDay || null };
    })
    .filter((x) => x.day);

  const todayCompleted = todayFocus.filter(
    (x) => x.day?.status === "Completed",
  ).length;

  // Calendar
  const calDays = () => {
    const yr = calMonth.getFullYear(),
      mo = calMonth.getMonth();
    const first = new Date(yr, mo, 1),
      last = new Date(yr, mo + 1, 0);
    const days: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(yr, mo, d));
    return days;
  };
  const dayStatusForCal = (date: Date, goal: Goal) => {
    const ds = date.toISOString().slice(0, 10);
    return (
      goal.dayActivities?.find((d) => d.dueDate?.slice(0, 10) === ds)?.status ||
      null
    );
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
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

        {/* Today Focus */}
        {todayFocus.length > 0 && (
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
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${todayCompleted === todayFocus.length ? "bg-green-100 text-green-700" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
              >
                {todayCompleted}/{todayFocus.length} done
              </span>
            </div>
            <div className="space-y-2">
              {todayFocus.map(({ goal, day }) => {
                if (!day) return null;
                const isDone = day.status === "Completed";
                return (
                  <div
                    key={goal._id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isDone ? "bg-green-50 dark:bg-green-950/20" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750"}`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${goal.color || "#6366f1"}20` }}
                    >
                      {CATEGORY_ICONS[goal.category] || "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${isDone ? "line-through text-gray-400" : "text-gray-800 dark:text-white"}`}
                      >
                        {goal.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Day {day.dayNumber}/21 · {day.title}
                      </p>
                    </div>
                    <button
                      onClick={() => completeDay(goal._id, day.dayNumber)}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}
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
              {todayCompleted === todayFocus.length &&
                todayFocus.length > 0 && (
                  <p className="text-center text-xs text-green-600 font-medium pt-1">
                    ✨ All done! You're building your future, one action at a
                    time.
                  </p>
                )}
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
                const done =
                  goal.dayActivities?.filter((d) => d.status === "Completed")
                    .length || 0;
                const pct = Math.round((done / 21) * 100);
                return (
                  <div
                    key={goal._id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selectedGoal?._id === goal._id ? "border-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20" : "border-gray-100 dark:border-gray-800 hover:border-indigo-200"}`}
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
                        completed={done}
                        total={21}
                        color={goal.color || "#6366f1"}
                      />
                      <div>
                        <p
                          className="text-xl font-black"
                          style={{ color: goal.color || "#6366f1" }}
                        >
                          {pct}%
                        </p>
                        <p className="text-xs text-gray-500">
                          Day {done} of 21
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: goal.color || "#6366f1",
                        }}
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
                <p className="text-xs text-gray-400">21-Day Plan</p>
                <p className="text-sm font-bold text-indigo-600">
                  Day{" "}
                  {selectedGoal.dayActivities?.filter(
                    (d) => d.status === "Completed",
                  ).length || 0}{" "}
                  of 21
                </p>
              </div>
            </div>

            {/* View switcher */}
            <div className="flex items-center gap-2 mb-4">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${planView === v ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300"}`}
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
                {selectedGoal.dayActivities?.map((day) => {
                  const isDone = day.status === "Completed";
                  const isMissed = day.status === "Missed";
                  const isToday = day.dueDate?.slice(0, 10) === today();
                  const isFuture = day.dueDate?.slice(0, 10) > today();
                  const isPast =
                    day.dueDate?.slice(0, 10) < today() && !isDone && !isMissed;
                  return (
                    <button
                      key={day.dayNumber}
                      onClick={() =>
                        completeDay(selectedGoal._id, day.dayNumber)
                      }
                      title={
                        isDone
                          ? `Day ${day.dayNumber} — Completed ✓`
                          : isFuture
                            ? `Day ${day.dayNumber} — Available on ${fmtDate(day.dueDate)}`
                            : isMissed
                              ? `Day ${day.dayNumber} — Missed`
                              : isToday
                                ? `Day ${day.dayNumber} — Due today!`
                                : `Day ${day.dayNumber}`
                      }
                      className={`w-full h-9 rounded-lg flex items-center justify-center text-xs font-bold relative transition-all border ${
                        isDone
                          ? "bg-green-500 border-green-500 text-white"
                          : isMissed
                            ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                            : isToday
                              ? "bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1 hover:scale-105"
                              : isFuture
                                ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300 cursor-not-allowed"
                                : isPast
                                  ? "bg-orange-50 border-orange-200 text-orange-400 cursor-not-allowed"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:scale-105"
                      }`}
                    >
                      {isDone ? (
                        <FaCheck className="w-2.5 h-2.5" />
                      ) : (
                        day.dayNumber
                      )}
                      {day.dayNumber === 21 && (
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
                {selectedGoal.dayActivities?.map((day) => {
                  const isDone = day.status === "Completed";
                  const isMissed = day.status === "Missed";
                  const isToday = day.dueDate?.slice(0, 10) === today();
                  return (
                    <div
                      key={day.dayNumber}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isToday ? "bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-200" : isDone ? "bg-green-50 dark:bg-green-950/20" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"}`}
                    >
                      <button
                        onClick={() =>
                          completeDay(selectedGoal._id, day.dayNumber)
                        }
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-green-500 border-green-500" : isMissed ? "bg-red-100 border-red-300" : "border-gray-300 hover:border-green-400"}`}
                      >
                        {isDone && (
                          <FaCheck className="text-white w-2.5 h-2.5" />
                        )}
                        {isMissed && (
                          <FaTimes className="text-red-500 w-2.5 h-2.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium ${isDone ? "line-through text-gray-400" : "text-gray-800 dark:text-white"}`}
                        >
                          Day {day.dayNumber} · {day.title}
                          {isToday && (
                            <span className="ml-2 bg-indigo-600 text-white px-1.5 py-0.5 rounded text-xs">
                              Today
                            </span>
                          )}
                          {day.dayNumber === 21 && (
                            <span className="ml-1">🏁</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fmtDate(day.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${isDone ? "bg-green-100 text-green-700" : isMissed ? "bg-red-100 text-red-600" : isToday ? "bg-amber-100 text-amber-700" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}
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

            {/* CALENDAR VIEW — compact, clean */}
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

                {/* Calendar grid — compact cells */}
                <div className="grid grid-cols-7 gap-1">
                  {calDays().map((date, i) => {
                    if (!date) return <div key={i} className="h-8" />;
                    const status = dayStatusForCal(date, selectedGoal);
                    const isT = date.toISOString().slice(0, 10) === today();
                    return (
                      <div
                        key={i}
                        className={`h-8 flex items-center justify-center rounded-lg text-xs font-medium relative transition-all
                          ${isT ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
                          ${
                            status === "Completed"
                              ? "bg-green-500 text-white"
                              : status === "Missed"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                : status
                                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700"
                                  : isT
                                    ? "text-indigo-700 dark:text-indigo-300 font-bold"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                      >
                        {date.getDate()}
                        {status === "Completed" && (
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

        {/* Backlog */}
        {backlog.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                Backlog{" "}
                <span className="text-gray-400 font-normal">
                  ({backlog.length})
                </span>
              </h2>
              <a
                href="/goals"
                className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
              >
                View All <FaArrowRight className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="space-y-2">
              {backlog.slice(0, 3).map((goal) => (
                <div
                  key={goal._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: `${goal.color || "#6366f1"}15` }}
                    >
                      {CATEGORY_ICONS[goal.category] || "🎯"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {goal.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-xs">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => activateGoal(goal._id)}
                    className="text-xs font-semibold border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ml-3"
                  >
                    Activate
                  </button>
                </div>
              ))}
            </div>
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
              Go to Goals and activate up to 3 to start your 21-day plan
            </p>
            <a
              href="/goals"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              Go to Goals <FaArrowRight className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
