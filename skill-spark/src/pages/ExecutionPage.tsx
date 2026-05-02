import { useState, useEffect } from "react";
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
  FaEllipsisV,
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
  const size = 80;
  const r = 32;
  const circ = 2 * Math.PI * r;
  const off = circ - (completed / total) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.8s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black" style={{ color }}>
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get("/goals");
      const all = res.data.data || [];
      const inProg = all.filter((g: Goal) => g.status === "In Progress");
      setGoals(inProg);
      setBacklog(all.filter((g: Goal) => g.status === "Not Started"));
      if (inProg.length > 0 && !selectedGoal) setSelectedGoal(inProg[0]);
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
    try {
      const res = await api.patch(`/goals/${goalId}/day/${dayNumber}/complete`);
      const updated = res.data.data;
      setGoals((p) => p.map((g) => (g._id === goalId ? updated : g)));
      if (selectedGoal?._id === goalId) setSelectedGoal(updated);
      toast.success(res.data.message);
    } catch {
      toast.error("Failed");
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

  // Today's focus — one task per active goal (today's due day)
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

  // Calendar helpers
  const calDays = () => {
    const yr = calMonth.getFullYear();
    const mo = calMonth.getMonth();
    const first = new Date(yr, mo, 1);
    const last = new Date(yr, mo + 1, 0);
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
      <div
        className="space-y-5 animate-fade-in"
        onClick={() => setOpenMenu(null)}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Execution</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track your daily actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
              <FaFire className="text-orange-500 w-3.5 h-3.5" />
              <span className="text-sm font-bold text-orange-600">
                {goals.length} day streak
              </span>
            </div>
          </div>
        </div>

        {/* Today Focus */}
        {todayFocus.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">◆</span>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Today Focus</h2>
                  <p className="text-xs text-gray-400">
                    Complete one action for each active goal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${todayCompleted === todayFocus.length ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {todayCompleted} / {todayFocus.length} Completed
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {todayFocus.map(({ goal, day }) => {
                if (!day) return null;
                const isDone = day.status === "Completed";
                return (
                  <div
                    key={goal._id}
                    className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${isDone ? "bg-green-50" : "bg-gray-50 hover:bg-gray-100"}`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${goal.color || "#6366f1"}20` }}
                    >
                      {CATEGORY_ICONS[goal.category] || "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}
                        style={{
                          color: isDone ? undefined : goal.color || "#6366f1",
                        }}
                      >
                        {goal.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Day {day.dayNumber} of 21 • {day.title}
                      </p>
                    </div>
                    <button
                      onClick={() => completeDay(goal._id, day.dayNumber)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400 hover:bg-green-50"}`}
                    >
                      {isDone ? (
                        <FaCheck className="text-white w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                    </button>
                  </div>
                );
              })}
              {todayCompleted === todayFocus.length &&
                todayFocus.length > 0 && (
                  <p className="text-center text-sm text-green-600 font-medium pt-1">
                    ✨ Great! You're building your future, one action at a time.
                  </p>
                )}
            </div>
          </div>
        )}

        {/* Active Goals Overview */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Active Goals Overview</h2>
              <a
                href="/goals"
                className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
              >
                Edit Goals <FaArrowRight className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {goals.map((goal) => {
                const completed =
                  goal.dayActivities?.filter((d) => d.status === "Completed")
                    .length || 0;
                const pct = Math.round((completed / 21) * 100);
                return (
                  <div
                    key={goal._id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selectedGoal?._id === goal._id ? "border-indigo-300 bg-indigo-50/30" : "border-gray-100 hover:border-indigo-200"}`}
                    onClick={() =>
                      setSelectedGoal(
                        selectedGoal?._id === goal._id ? null : goal,
                      )
                    }
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">
                        {CATEGORY_ICONS[goal.category] || "🎯"}
                      </span>
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {goal.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CircleProgress
                        completed={completed}
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
                        <p className="text-xs text-gray-500">Completed</p>
                        <p
                          className="text-xs font-semibold mt-1"
                          style={{ color: goal.color || "#6366f1" }}
                        >
                          {completed} days completed
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
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

        {/* 21-Day Plan Detail for Selected Goal */}
        {selectedGoal && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {CATEGORY_ICONS[selectedGoal.category] || "🎯"}
                </span>
                <div>
                  <h2 className="font-bold text-gray-900">
                    {selectedGoal.title}
                  </h2>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {selectedGoal.description}
                </p>
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-gray-500 font-medium">View:</span>
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${planView === v ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-500 hover:border-indigo-300"}`}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 21-Day Progress header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 text-sm">
                21-Day Progress
              </h3>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" />
                  Completed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-red-400 rounded-full inline-block" />
                  Missed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-gray-300 rounded-full inline-block" />
                  Upcoming
                </span>
              </div>
            </div>

            {/* GRID VIEW (default per image 3) */}
            {planView === "grid" && (
              <div className="grid grid-cols-7 gap-2.5">
                {selectedGoal.dayActivities?.map((day) => {
                  const isDone = day.status === "Completed";
                  const isMissed = day.status === "Missed";
                  const isToday = day.dueDate?.slice(0, 10) === today();
                  return (
                    <button
                      key={day.dayNumber}
                      onClick={() =>
                        completeDay(selectedGoal._id, day.dayNumber)
                      }
                      title={`Day ${day.dayNumber} — ${fmtDate(day.dueDate)}`}
                      className={`aspect-square rounded-full flex flex-col items-center justify-center text-sm font-bold relative transition-all hover:scale-105 border-2 ${
                        isDone
                          ? "bg-green-500 border-green-500 text-white shadow-sm"
                          : isMissed
                            ? "bg-red-100 border-red-300 text-red-600"
                            : isToday
                              ? "bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1"
                              : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"
                      }`}
                    >
                      {day.dayNumber}
                      {isDone && (
                        <span className="absolute bottom-0.5 text-xs leading-none">
                          ✓
                        </span>
                      )}
                      {isMissed && (
                        <FaTimes className="absolute bottom-1 text-red-400 w-2.5 h-2.5" />
                      )}
                      {isToday && (
                        <span className="absolute -bottom-5 text-xs text-indigo-600 font-semibold whitespace-nowrap">
                          Today
                        </span>
                      )}
                      {day.dayNumber === 21 && (
                        <span className="absolute -top-1 -right-1 text-yellow-500 text-xs">
                          🏁
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {planView === "list" && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedGoal.dayActivities?.map((day) => {
                  const isDone = day.status === "Completed";
                  const isMissed = day.status === "Missed";
                  const isToday = day.dueDate?.slice(0, 10) === today();
                  return (
                    <div
                      key={day.dayNumber}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isToday
                          ? "bg-indigo-50 border border-indigo-100 ring-1 ring-indigo-200"
                          : isDone
                            ? "bg-green-50"
                            : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <button
                        onClick={() =>
                          completeDay(selectedGoal._id, day.dayNumber)
                        }
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isDone
                            ? "bg-green-500 border-green-500"
                            : isMissed
                              ? "bg-red-100 border-red-300"
                              : "border-gray-300 hover:border-green-400"
                        }`}
                      >
                        {isDone && <FaCheck className="text-white w-3 h-3" />}
                        {isMissed && (
                          <FaTimes className="text-red-500 w-3 h-3" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}
                        >
                          Day {day.dayNumber} {day.title}
                          {isToday && (
                            <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fmtDate(day.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                          isDone
                            ? "bg-green-100 text-green-700"
                            : isMissed
                              ? "bg-red-100 text-red-600"
                              : isToday
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isDone
                          ? "✓ Completed"
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
                <div className="flex items-center justify-between mb-4">
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
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-semibold text-gray-800">
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
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <div
                        key={d}
                        className="text-center text-xs font-medium text-gray-400 py-1"
                      >
                        {d}
                      </div>
                    ),
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calDays().map((date, i) => {
                    if (!date) return <div key={i} />;
                    const status = dayStatusForCal(date, selectedGoal);
                    const isT = date.toISOString().slice(0, 10) === today();
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded-full text-xs relative ${
                          isT ? "ring-2 ring-indigo-400 font-bold" : ""
                        } ${
                          status === "Completed"
                            ? "bg-green-500 text-white"
                            : status === "Missed"
                              ? "bg-red-100 text-red-600"
                              : status
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-gray-600"
                        }`}
                      >
                        {date.getDate()}
                        {status === "Completed" && (
                          <span className="absolute -bottom-0.5 right-0 text-xs leading-none">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-center text-green-600 font-medium mt-5">
              ⭐ Consistency is your superpower. Don't break the chain!
            </p>
          </div>
        )}

        {/* Backlog Goals */}
        {backlog.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                Backlog Goals{" "}
                <span className="text-gray-400 font-normal text-sm">
                  (Not Started)
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
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${goal.color || "#6366f1"}15` }}
                    >
                      {CATEGORY_ICONS[goal.category] || "🎯"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {goal.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => activateGoal(goal._id)}
                    className="text-xs font-semibold border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
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
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">⚡</p>
            <p className="font-semibold text-gray-700 text-lg">
              No active goals yet
            </p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Go to Intent (Goals) and activate up to 3 goals to start your
              21-day execution plan
            </p>
            <a
              href="/goals"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              Go to Goals <FaArrowRight className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
