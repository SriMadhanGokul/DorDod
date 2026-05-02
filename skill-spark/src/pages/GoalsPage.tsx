import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTimes,
  FaEllipsisV,
  FaCheck,
  FaList,
  FaCalendarAlt,
  FaTh,
  FaChevronLeft,
  FaChevronRight,
  FaFire,
  FaFlag,
  FaEdit,
  FaTrash,
  FaArrowRight,
} from "react-icons/fa";

interface DayActivity {
  _id: string;
  dayNumber: number;
  title: string;
  dueDate: string;
  status: "Upcoming" | "Completed" | "Missed" | "Late";
  completedAt?: string;
}
interface Goal {
  _id: string;
  title: string;
  description: string;
  category: string;
  goalType: string;
  priority: string;
  status: string;
  progress: number;
  icon: string;
  color: string;
  startDate?: string;
  expectedEndDate?: string;
  measurementCriteria: string;
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
const GOAL_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "";

const DayStatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    Completed: "bg-green-100 text-green-700 border-green-200",
    Missed: "bg-red-100 text-red-700 border-red-200",
    Late: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Upcoming: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const labels: Record<string, string> = {
    Completed: "✓ Completed On Time",
    Missed: "Missed",
    Late: "Late",
    Upcoming: "Not Done",
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${cfg[status] || cfg.Upcoming}`}
    >
      {labels[status] || status}
    </span>
  );
};

const CircleProgress = ({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) => {
  const size = 80;
  const r = 32;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;
  const off = circ - pct * circ;
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
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
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
};

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "Career",
  goalType: "Personal",
  priority: "Medium",
  measurementCriteria: "",
  startDate: "",
  expectedEndDate: "",
  icon: "🎯",
  color: "#6366f1",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Goal | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [planView, setPlanView] = useState<"list" | "grid" | "calendar">(
    "list",
  );
  const [calMonth, setCalMonth] = useState(new Date());
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const inProgress = goals.filter((g) => g.status === "In Progress");
  const backlog = goals.filter((g) => g.status === "Not Started");
  const completed = goals.filter((g) => g.status === "Completed");

  // Today's focus — one activity per active goal (today's day)
  const todayFocus = inProgress
    .map((goal) => {
      const todayStr = today();
      const todayDay = goal.dayActivities?.find(
        (d) => d.dueDate?.slice(0, 10) === todayStr,
      );
      if (!todayDay) {
        // Find first incomplete upcoming day
        const next = goal.dayActivities?.find((d) => d.status === "Upcoming");
        return next ? { goal, day: next } : null;
      }
      return { goal, day: todayDay };
    })
    .filter(Boolean) as { goal: Goal; day: DayActivity }[];

  const create = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.category) return toast.error("Category is required");
    if (!form.measurementCriteria.trim())
      return toast.error("Measurement criteria is required");
    setSaving(true);
    try {
      const res = await api.post("/goals", form);
      setGoals((p) => [res.data.data, ...p]);
      setForm({ ...EMPTY_FORM });
      setShowCreate(false);
      toast.success(
        "Goal created and added to Backlog! Activate to start the 21-day plan.",
      );
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!showEdit) return;
    setSaving(true);
    try {
      const res = await api.put(`/goals/${showEdit._id}`, form);
      setGoals((p) =>
        p.map((g) => (g._id === showEdit._id ? res.data.data : g)),
      );
      if (selectedGoal?._id === showEdit._id) setSelectedGoal(res.data.data);
      setShowEdit(null);
      toast.success("Goal updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const activate = async (id: string) => {
    try {
      const res = await api.patch(`/goals/${id}/activate`);
      setGoals((p) => p.map((g) => (g._id === id ? res.data.data : g)));
      setMeta((m: any) => ({
        ...m,
        inProgressCount: (m.inProgressCount || 0) + 1,
        canActivate: (m.canActivate || 1) - 1,
      }));
      toast.success(res.data.message);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const deactivate = async (id: string) => {
    try {
      const res = await api.patch(`/goals/${id}/deactivate`);
      setGoals((p) => p.map((g) => (g._id === id ? res.data.data : g)));
      toast.success("Moved to Backlog");
    } catch {
      toast.error("Failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      setGoals((p) => p.filter((g) => g._id !== id));
      if (selectedGoal?._id === id) setSelectedGoal(null);
      toast.success("Deleted!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const completeDay = async (goalId: string, dayNumber: number) => {
    try {
      const res = await api.patch(`/goals/${goalId}/day/${dayNumber}/complete`);
      setGoals((p) => p.map((g) => (g._id === goalId ? res.data.data : g)));
      if (selectedGoal?._id === goalId) setSelectedGoal(res.data.data);
      toast.success(res.data.message);
    } catch {
      toast.error("Failed");
    }
  };

  const completeTodayActivity = async (goal: Goal, day: DayActivity) => {
    await completeDay(goal._id, day.dayNumber);
  };

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
  const dayStatusForCalendar = (date: Date, goal: Goal) => {
    const ds = date.toISOString().slice(0, 10);
    const act = goal.dayActivities?.find((d) => d.dueDate?.slice(0, 10) === ds);
    return act?.status || null;
  };

  // GoalFormFields
  const GoalFormFields = ({ f, setF }: { f: any; setF: any }) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Goal Title <span className="text-red-500">*</span>
        </label>
        <input
          value={f.title}
          onChange={(e) => setF((p: any) => ({ ...p, title: e.target.value }))}
          placeholder="What do you want to achieve?"
          className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Goal Type
          </label>
          <select
            value={f.goalType}
            onChange={(e) =>
              setF((p: any) => ({ ...p, goalType: e.target.value }))
            }
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          >
            <option value="">Please select</option>
            <option value="Personal">Personal</option>
            <option value="Professional">Professional</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={f.category}
            onChange={(e) =>
              setF((p: any) => ({ ...p, category: e.target.value }))
            }
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          >
            <option value="">Please select</option>
            {[
              "Career",
              "Fitness",
              "Financial",
              "Intellectual",
              "Spiritual",
              "Family",
              "Social",
              "Other",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Description
        </label>
        <textarea
          value={f.description}
          onChange={(e) =>
            setF((p: any) => ({ ...p, description: e.target.value }))
          }
          placeholder="Describe your goal..."
          rows={2}
          className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Priority
          </label>
          <select
            value={f.priority}
            onChange={(e) =>
              setF((p: any) => ({ ...p, priority: e.target.value }))
            }
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          >
            <option value="">Please select</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Color
          </label>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {GOAL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setF((p: any) => ({ ...p, color: c }))}
                className={`w-7 h-7 rounded-full transition-all ${f.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Start Date
          </label>
          <input
            type="date"
            value={f.startDate}
            onChange={(e) =>
              setF((p: any) => ({ ...p, startDate: e.target.value }))
            }
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            End Date
          </label>
          <input
            type="date"
            value={f.expectedEndDate}
            onChange={(e) =>
              setF((p: any) => ({ ...p, expectedEndDate: e.target.value }))
            }
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Measurement Criteria <span className="text-red-500">*</span>
        </label>
        <input
          value={f.measurementCriteria}
          onChange={(e) =>
            setF((p: any) => ({ ...p, measurementCriteria: e.target.value }))
          }
          placeholder="How will you measure success?"
          className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        />
      </div>
    </div>
  );

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
        className="space-y-6 animate-fade-in"
        onClick={() => setOpenMenu(null)}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Goals (Intent)</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set your intentions. Focus on 3. Execute daily.
            </p>
          </div>
          <button
            onClick={() => {
              setForm({ ...EMPTY_FORM });
              setShowCreate(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <FaPlus className="w-3 h-3" /> New Goal
          </button>
        </div>

        {/* Focus Capacity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Focus Capacity</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                You can have up to 3 goals in progress.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${inProgress.length >= 3 ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"}`}
              >
                {inProgress.length} / 3 Active
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${(inProgress.length / 3) * 100}%` }}
            />
          </div>
          {inProgress.length >= 3 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              ⚠️ Focus capacity full. Complete or move a goal to backlog to
              activate new ones.
            </p>
          )}
        </div>

        {/* In-Progress Goals */}
        {inProgress.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">
                In-Progress Goals ({inProgress.length})
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {inProgress.map((goal) => {
                const completed =
                  goal.dayActivities?.filter((d) => d.status === "Completed")
                    .length || 0;
                const pct = Math.round((completed / 21) * 100);
                return (
                  <div
                    key={goal._id}
                    className={`bg-white rounded-2xl border-2 shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${selectedGoal?._id === goal._id ? "border-indigo-400" : " border-gray-100"}`}
                    onClick={() =>
                      setSelectedGoal(
                        selectedGoal?._id === goal._id ? null : goal,
                      )
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {CATEGORY_ICONS[goal.category] || "🎯"}
                        </span>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">
                            {goal.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {goal.description}
                          </p>
                        </div>
                      </div>
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === goal._id ? null : goal._id)
                          }
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <FaEllipsisV className="w-3.5 h-3.5" />
                        </button>
                        {openMenu === goal._id && (
                          <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-36 overflow-hidden">
                            <button
                              onClick={() => {
                                setShowEdit(goal);
                                setForm({
                                  title: goal.title,
                                  description: goal.description,
                                  category: goal.category,
                                  goalType: goal.goalType,
                                  priority: goal.priority,
                                  measurementCriteria: goal.measurementCriteria,
                                  startDate: goal.startDate?.slice(0, 10) || "",
                                  expectedEndDate:
                                    goal.expectedEndDate?.slice(0, 10) || "",
                                  icon: goal.icon || "🎯",
                                  color: goal.color || "#6366f1",
                                });
                                setOpenMenu(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <FaEdit className="w-3 h-3 text-indigo-500" />{" "}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                deactivate(goal._id);
                                setOpenMenu(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              📦 Move to Backlog
                            </button>
                            <button
                              onClick={() => {
                                del(goal._id);
                                setOpenMenu(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-500"
                            >
                              <FaTrash className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <CircleProgress
                        completed={completed}
                        total={21}
                        color={goal.color || "#6366f1"}
                      />
                      <div>
                        <p
                          className="text-2xl font-black"
                          style={{ color: goal.color || "#6366f1" }}
                        >
                          {pct}%
                        </p>
                        <p className="text-xs text-gray-500">Completed</p>
                        <p
                          className="text-xs font-medium mt-1"
                          style={{ color: goal.color || "#6366f1" }}
                        >
                          Day {completed} of 21
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

        {/* Today's Focus */}
        {todayFocus.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Today's Focus</h2>
              <span className="text-xs text-gray-400">
                One action per active goal
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {todayFocus.map(({ goal, day }) => (
                <div
                  key={goal._id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${day.status === "Completed" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 hover:border-indigo-200"}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl shrink-0">
                      {CATEGORY_ICONS[goal.category] || "🎯"}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${day.status === "Completed" ? "line-through text-gray-400" : "text-gray-800"}`}
                      >
                        {day.title}
                      </p>
                      <p
                        className="text-xs text-gray-500"
                        style={{ color: goal.color || "#6366f1" }}
                      >
                        {goal.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeTodayActivity(goal, day)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 transition-all ${day.status === "Completed" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}
                  >
                    {day.status === "Completed" && (
                      <FaCheck className="text-white w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 21-Day Plan for Selected Goal */}
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
              <div className="flex items-center gap-3">
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
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div
                    className="rounded-full h-2"
                    style={{
                      width: `${((selectedGoal.dayActivities?.filter((d) => d.status === "Completed").length || 0) / 21) * 100}%`,
                      background: selectedGoal.color || "#6366f1",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
              {(["list", "grid", "calendar"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setPlanView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${planView === v ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {v === "list" && <FaList className="w-3 h-3" />}
                  {v === "grid" && <FaTh className="w-3 h-3" />}
                  {v === "calendar" && <FaCalendarAlt className="w-3 h-3" />}
                  {v.charAt(0).toUpperCase() + v.slice(1)} View
                </button>
              ))}
            </div>

            {/* LIST VIEW */}
            {planView === "list" && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedGoal.dayActivities?.map((day) => {
                  const isDone = day.status === "Completed";
                  const isToday = day.dueDate?.slice(0, 10) === today();
                  return (
                    <div
                      key={day._id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${isToday ? "bg-indigo-50 border border-indigo-100" : isDone ? "bg-green-50" : "bg-gray-50"} ${isToday ? "ring-2 ring-indigo-200" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            completeDay(selectedGoal._id, day.dayNumber)
                          }
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}
                        >
                          {isDone && <FaCheck className="text-white w-3 h-3" />}
                          {day.status === "Missed" && (
                            <FaTimes className="text-red-500 w-3 h-3" />
                          )}
                        </button>
                        <div>
                          <p
                            className={`text-sm font-medium ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}
                          >
                            Day {day.dayNumber} {day.title}
                            {isToday && (
                              <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                Today
                              </span>
                            )}
                            {day.dayNumber === 21 && (
                              <FaFlag className="inline ml-1 text-yellow-500 w-3 h-3" />
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {fmtDate(day.dueDate)}
                          </p>
                        </div>
                      </div>
                      <DayStatusBadge status={day.status} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* GRID VIEW */}
            {planView === "grid" && (
              <div>
                <div className="grid grid-cols-7 gap-2 mb-3">
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
                        className={`aspect-square rounded-full flex flex-col items-center justify-center text-sm font-bold border-2 transition-all hover:scale-110 relative ${
                          isDone
                            ? "bg-green-500 border-green-500 text-white"
                            : isMissed
                              ? "bg-red-100 border-red-300 text-red-600"
                              : isToday
                                ? "bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1"
                                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                        }`}
                      >
                        {day.dayNumber}
                        {isDone && (
                          <span className="absolute -bottom-1 text-xs">✓</span>
                        )}
                        {isMissed && (
                          <span className="absolute -bottom-1 text-xs">✗</span>
                        )}
                        {day.dayNumber === 21 && (
                          <FaFlag className="absolute -top-1 -right-1 text-yellow-500 w-3 h-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mt-3">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
                    &nbsp;Completed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-300 rounded-full inline-block" />
                    &nbsp;Missed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-200 rounded-full inline-block" />
                    &nbsp;Upcoming
                  </span>
                </div>
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
                    const status = dayStatusForCalendar(date, selectedGoal);
                    const isT = date.toISOString().slice(0, 10) === today();
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded-full text-sm relative transition-all ${
                          isT ? "ring-2 ring-indigo-400" : ""
                        } ${
                          status === "Completed"
                            ? "bg-green-500 text-white"
                            : status === "Missed"
                              ? "bg-red-100 text-red-600"
                              : status
                                ? "bg-indigo-100 text-indigo-600"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {date.getDate()}
                        {status === "Completed" && (
                          <span className="absolute bottom-0.5 right-0.5 text-xs">
                            ✓
                          </span>
                        )}
                        {isT && (
                          <span className="absolute -bottom-3 text-xs text-indigo-600 font-semibold">
                            Today
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mt-6">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
                    &nbsp;Completed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-300 rounded-full inline-block" />
                    &nbsp;Missed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-200 rounded-full inline-block" />
                    &nbsp;Upcoming
                  </span>
                </div>
              </div>
            )}
            <p className="text-xs text-green-600 text-center mt-4">
              ⭐ Consistency is your superpower. Don't break the chain!
            </p>
          </div>
        )}

        {/* Backlog Goals */}
        {backlog.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">
                Backlog Goals ({backlog.length})
              </h2>
              <span className="text-xs text-gray-400">
                All your goals. Activate up to 3 to focus.
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {backlog.map((goal) => (
                <div
                  key={goal._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${goal.color || "#6366f1"}15` }}
                    >
                      {CATEGORY_ICONS[goal.category] || "🎯"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {goal.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => activate(goal._id)}
                      disabled={inProgress.length >= 3}
                      className="text-sm font-semibold border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-1.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Activate
                    </button>
                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === `b${goal._id}` ? null : `b${goal._id}`,
                          )
                        }
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <FaEllipsisV className="w-3.5 h-3.5" />
                      </button>
                      {openMenu === `b${goal._id}` && (
                        <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-32 overflow-hidden">
                          <button
                            onClick={() => {
                              setShowEdit(goal);
                              setForm({
                                title: goal.title,
                                description: goal.description,
                                category: goal.category,
                                goalType: goal.goalType,
                                priority: goal.priority,
                                measurementCriteria: goal.measurementCriteria,
                                startDate: goal.startDate?.slice(0, 10) || "",
                                expectedEndDate:
                                  goal.expectedEndDate?.slice(0, 10) || "",
                                icon: goal.icon || "🎯",
                                color: goal.color || "#6366f1",
                              });
                              setOpenMenu(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <FaEdit className="w-3 h-3 text-indigo-500" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              del(goal._id);
                              setOpenMenu(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-500"
                          >
                            <FaTrash className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Goals (collapsed) */}
        {completed.length > 0 && (
          <details className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <summary className="font-semibold text-sm text-gray-700 cursor-pointer flex items-center gap-2">
              <span className="text-green-600">✅</span> Completed Goals (
              {completed.length})
            </summary>
            <div className="mt-3 space-y-2">
              {completed.map((g) => (
                <div
                  key={g._id}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-xl"
                >
                  <span className="text-xl">
                    {CATEGORY_ICONS[g.category] || "🎯"}
                  </span>
                  <p className="text-sm font-medium text-gray-700 line-through">
                    {g.title}
                  </p>
                  <span className="ml-auto text-xs text-green-600 font-medium">
                    100% ✓
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {goals.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-semibold text-gray-700 text-lg">No goals yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Create your first goal to begin your 21-day journey
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              + Create First Goal
            </button>
          </div>
        )}

        {/* CREATE MODAL */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-auto shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">New Goal</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    New goals go to Backlog. Activate to start 21-day plan.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <GoalFormFields f={form} setF={setForm} />
              <button
                onClick={create}
                disabled={saving}
                className="w-full mt-5 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {saving ? "Creating..." : "Create Goal →"}
              </button>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-auto shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FaEdit className="text-indigo-500" /> Edit Goal
                </h2>
                <button
                  onClick={() => setShowEdit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <GoalFormFields f={form} setF={setForm} />
              <button
                onClick={saveEdit}
                disabled={saving}
                className="w-full mt-5 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
