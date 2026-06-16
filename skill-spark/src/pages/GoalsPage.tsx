import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaLink,
  FaPause,
  FaPlay,
  FaUnlock,
  FaTrophy,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";

interface Goal {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  progress: number;
  status: string;
  targetDate?: string;
  duration?: number;
  linkedHabits: any[];
}

interface GoalStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  completionRate: number;
}

function GoalModal({
  goal,
  onClose,
  onSave,
}: {
  goal?: Goal | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: goal?.title || "",
    description: goal?.description || "",
    category: goal?.category || "Personal",
    priority: goal?.priority || "Medium",
    duration: goal?.duration || 21,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = "Goal title is required";
    if (!form.description.trim())
      newErrors.description = "Description is required";
    if (!form.category) newErrors.category = "Category is required";
    if (!form.priority) newErrors.priority = "Priority is required";
    if (!form.duration || form.duration < 1 || form.duration > 365) {
      newErrors.duration = "Duration must be between 1 and 365 days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (goal) {
        await api.put(`/goals/${goal._id}`, form);
        toast.success("Goal updated!");
      } else {
        await api.post("/goals", form);
        toast.success("Goal created! Now activate it to start 🎯");
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="font-bold text-gray-900 dark:text-white">
            {goal ? "Edit Goal" : "Create New Goal"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              💡 <strong>Did you know?</strong> The duration you set becomes
              your target! Activate the goal to start tracking your progress. A
              longer duration builds lasting habits. A shorter one creates quick
              wins.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Goal Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Learn React Basics"
              className={`w-full px-3 py-2.5 rounded-xl border ${
                errors.title
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              } text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.title && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe your goal and why it matters to you..."
              className={`w-full px-3 py-2.5 rounded-xl border ${
                errors.description
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              } text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.category
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                } text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select category</option>
                <option value="Personal">Personal</option>
                <option value="Career">Career</option>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.priority
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                } text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.priority}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block flex items-center gap-2">
              <FaClock className="text-blue-600" />
              Duration <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="365"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: parseInt(e.target.value) })
                }
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <span className="min-w-fit text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                {form.duration} day{form.duration !== 1 ? "s" : ""}
              </span>
            </div>
            {errors.duration && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.duration}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
              Choose a duration that challenges you. Short durations (1-30 days)
              = quick wins 🚀. Long durations (31-365 days) = deep mastery 🎓
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300">
              ✅ <strong>All fields are required</strong> to create a complete
              goal. This ensures you have a clear vision and commitment!
            </p>
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  isActive,
  canActivate,
  activeCount,
  onEdit,
  onDelete,
  onActivate,
  onPause,
  onResume,
}: {
  goal: Goal;
  isActive: boolean;
  canActivate: boolean;
  activeCount: number;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`rounded-2xl border p-4 hover:shadow-md transition-all ${
        isActive
          ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
          : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {goal.status === "completed" && (
              <div className="text-xl text-green-600">
                <FaCheckCircle />
              </div>
            )}

            <div className="flex-1">
              <h3
                onClick={() => isActive && navigate(`/execution/${goal._id}`)}
                className={`font-semibold text-sm ${
                  isActive ? "cursor-pointer hover:opacity-80" : ""
                } ${
                  goal.status === "completed"
                    ? "line-through text-gray-500"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {goal.title}
              </h3>
              {goal.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          {/* Status and Metadata */}
          <div className="mt-3 ml-8 flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                goal.status === "active"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : goal.status === "completed"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : goal.status === "paused"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {goal.status === "archived"
                ? "Available"
                : goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </span>

            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
              {goal.category}
            </span>

            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                goal.priority === "High"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : goal.priority === "Medium"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              }`}
            >
              {goal.priority}
            </span>

            {goal.duration && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <FaClock className="text-xs" />
                {goal.duration} day{goal.duration !== 1 ? "s" : ""}
              </span>
            )}

            {goal.linkedHabits && goal.linkedHabits.length > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <FaLink className="text-xs" />
                {goal.linkedHabits.length} habit
                {goal.linkedHabits.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Progress Bar - Auto Completion */}
          {isActive && (
            <div className="mt-3 ml-8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Auto-Complete Progress
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {goal.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    goal.progress === 100 ? "bg-green-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              {goal.progress === 100 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">
                  ✅ Goal will auto-complete when all days are marked!
                </p>
              )}
            </div>
          )}

          {/* Info: How completion works */}
          {goal.status === "completed" && (
            <div className="mt-3 ml-8 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300">
                🎉 <strong>Auto-completed!</strong> All required days were
                marked. Great consistency!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {/* ACTIVATE BUTTON */}
          {goal.status !== "active" && goal.status !== "completed" && (
            <button
              onClick={() => onActivate(goal._id)}
              disabled={!canActivate && goal.status === "archived"}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${
                canActivate || goal.status !== "archived"
                  ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
              title={
                canActivate
                  ? "Activate this goal"
                  : `Maximum 3 active goals (${activeCount} active)`
              }
            >
              <FaUnlock className="text-sm" />
              Activate
            </button>
          )}

          {/* PAUSE BUTTON */}
          {isActive && (
            <button
              onClick={() => onPause(goal._id)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
              title="Pause goal"
            >
              <FaPause className="text-sm" />
            </button>
          )}

          {/* RESUME BUTTON */}
          {goal.status === "paused" && (
            <button
              onClick={() => onResume(goal._id)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Resume goal"
            >
              <FaPlay className="text-sm" />
            </button>
          )}

          {/* EDIT BUTTON */}
          <button
            onClick={() => onEdit(goal)}
            className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <FaEdit className="text-sm" />
          </button>

          {/* DELETE BUTTON */}
          <button
            onClick={() => onDelete(goal._id)}
            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <FaTrash className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats>({
    total: 0,
    active: 0,
    completed: 0,
    paused: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const [goalsRes, statsRes] = await Promise.all([
        api.get("/goals"),
        api.get("/goals/stats"),
      ]);

      if (goalsRes.data.success) {
        setGoals(goalsRes.data.data);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePause = async (goalId: string) => {
    try {
      await api.put(`/goals/${goalId}/pause`);
      toast.success("Goal paused");
      load();
    } catch (err: any) {
      toast.error("Failed to pause goal");
    }
  };

  const handleResume = async (goalId: string) => {
    try {
      await api.put(`/goals/${goalId}/resume`);
      toast.success("Goal resumed!");
      load();
    } catch (err: any) {
      toast.error("Failed to resume goal");
    }
  };

  const handleActivate = async (goalId: string) => {
    const activeCount = goals.filter((g) => g.status === "active").length;

    if (activeCount >= 3) {
      toast.error(
        "You can only have 3 active goals at a time. Pause one to activate another.",
      );
      return;
    }

    try {
      await api.patch(`/goals/${goalId}/activate`);
      toast.success(
        "Goal activated! 🚀 Click on goal title to start tracking!",
      );
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to activate goal");
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!window.confirm("Delete this goal permanently?")) return;
    try {
      await api.delete(`/goals/${goalId}`);
      toast.success("Goal deleted");
      load();
    } catch (err: any) {
      toast.error("Failed to delete goal");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );

  const activeGoals = goals.filter((g) => g.status === "active");
  const availableGoals = goals.filter((g) => g.status === "archived");
  const pausedGoals = goals.filter((g) => g.status === "paused");
  const finishedGoals = goals.filter((g) => g.status === "completed");
  const activeCount = activeGoals.length;
  const canActivateMore = activeCount < 3;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Goals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Define and track your aspirations
          </p>
        </div>
        <button
          onClick={() => {
            setEditGoal(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FaPlus className="text-xs" /> New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">
            Total Goals
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.total}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 font-semibold">
            Active
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {stats.active}/3
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
            Finished
          </p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {stats.completed}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
            Completion Rate
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.completionRate}%
          </p>
        </div>
      </div>

      {/* ACTIVE GOALS SECTION */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🚀 Active Goals ({activeCount}/3)
        </h2>

        {activeCount === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No active goals yet. Activate goals from the "Available Goals"
              section below! ⬇️
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                isActive={true}
                canActivate={false}
                activeCount={activeCount}
                onEdit={(g) => {
                  setEditGoal(g);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onActivate={handleActivate}
                onPause={handlePause}
                onResume={handleResume}
              />
            ))}
          </div>
        )}
      </div>

      {/* AVAILABLE GOALS SECTION */}
      {availableGoals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📋 Available Goals ({availableGoals.length})
            </h2>
            {!canActivateMore && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ Max 3 active (pause one to activate another)
              </span>
            )}
          </div>

          <div className="space-y-2">
            {availableGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                isActive={false}
                canActivate={canActivateMore}
                activeCount={activeCount}
                onEdit={(g) => {
                  setEditGoal(g);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onActivate={handleActivate}
                onPause={handlePause}
                onResume={handleResume}
              />
            ))}
          </div>
        </div>
      )}

      {/* PAUSED GOALS SECTION */}
      {pausedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ⏸️ Paused Goals ({pausedGoals.length})
          </h2>

          <div className="space-y-2">
            {pausedGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                isActive={false}
                canActivate={canActivateMore}
                activeCount={activeCount}
                onEdit={(g) => {
                  setEditGoal(g);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onActivate={handleActivate}
                onPause={handlePause}
                onResume={handleResume}
              />
            ))}
          </div>
        </div>
      )}

      {/* FINISHED GOALS SECTION */}
      {finishedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> Finished Goals (
            {finishedGoals.length})
          </h2>

          <div className="space-y-2">
            {finishedGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                isActive={false}
                canActivate={false}
                activeCount={activeCount}
                onEdit={(g) => {
                  setEditGoal(g);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onActivate={handleActivate}
                onPause={handlePause}
                onResume={handleResume}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/50">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
          💡 How Automatic Completion Works
        </h3>
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <div>
            1️⃣ <strong>Create & Activate:</strong> Set up your goal with
            duration 1-365 days and activate it (max 3 active)
          </div>
          <div>
            2️⃣ <strong>Click on Goal Title:</strong> Go to the goal's execution
            page to track daily progress
          </div>
          <div>
            3️⃣ <strong>Mark Days:</strong> Click days to mark them complete
          </div>
          <div>
            4️⃣ <strong>Auto-Complete:</strong> When all days are marked ✅, the
            goal automatically completes
          </div>
          <div>
            5️⃣ <strong>Missed Days:</strong> Missed days show as ❌ but don't
            stop the goal
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <GoalModal
          goal={editGoal}
          onClose={() => {
            setShowModal(false);
            setEditGoal(null);
          }}
          onSave={load}
        />
      )}
    </div>
  );
}
