import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaLink,
  FaUnlink,
  FaClock,
  FaCheck,
  FaHistory,
  FaClock as FaClockIcon,
} from "react-icons/fa";

// ✅ IMPORT DASHBOARD REFRESH TRIGGER
import { triggerDashboardRefresh } from "@/pages/DashboardPage";

// ✅ Helper: Get today's date as string (YYYY-MM-DD) - CONSISTENT WITH BACKEND
const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

// ✅ Helper: Convert tracking date to comparable string
const getTrackingDateString = (
  date: string | Date | undefined,
): string | null => {
  if (!date) return null;

  if (typeof date === "string") {
    // Already a string, return it
    return date;
  }

  // Convert Date object to string
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return null;
  }
};

interface Habit {
  _id: string;
  title: string;
  description: string;
  category: string;
  frequency: string;
  timeStart?: string;
  timeEnd?: string;
  linkedGoal?: string;
  linkedGoalTitle?: string;
  tracking?: Array<{
    date: string | Date;
    status: "completed" | "missed" | "pending";
    completedAt?: string | Date;
  }>;
}

interface Goal {
  _id: string;
  title: string;
  status: string;
}

function HabitModal({
  habit,
  existingHabits,
  onClose,
  onSave,
}: {
  habit?: Habit | null;
  existingHabits: Habit[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: habit?.title || "",
    description: habit?.description || "",
    category: habit?.category || "Productivity",
    frequency: habit?.frequency || "Daily",
    timeStart: habit?.timeStart || "",
    timeEnd: habit?.timeEnd || "",
    shouldLinkGoal: !!habit?.linkedGoal,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkTimeOverlap = (): boolean => {
    if (!form.timeStart || !form.timeEnd) return false;

    const [startHour, startMin] = form.timeStart.split(":").map(Number);
    const [endHour, endMin] = form.timeEnd.split(":").map(Number);
    const formStart = startHour * 60 + startMin;
    const formEnd = endHour * 60 + endMin;

    const habitsToCheck = existingHabits.filter((h) => h._id !== habit?._id);

    for (const existingHabit of habitsToCheck) {
      if (!existingHabit.timeStart || !existingHabit.timeEnd) continue;

      const [eStartHour, eStartMin] = existingHabit.timeStart
        .split(":")
        .map(Number);
      const [eEndHour, eEndMin] = existingHabit.timeEnd.split(":").map(Number);
      const existingStart = eStartHour * 60 + eStartMin;
      const existingEnd = eEndHour * 60 + eEndMin;

      if (
        (formStart < existingEnd && formEnd > existingStart) ||
        (formStart === existingStart && formEnd === existingEnd)
      ) {
        return true;
      }
    }

    return false;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = "Habit title is required";
    if (!form.description.trim())
      newErrors.description = "Description is required";
    if (!form.timeStart) newErrors.timeStart = "Start time is required";
    if (!form.timeEnd) newErrors.timeEnd = "End time is required";

    if (form.timeStart && form.timeEnd) {
      const [startHour, startMin] = form.timeStart.split(":").map(Number);
      const [endHour, endMin] = form.timeEnd.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        newErrors.timeEnd = "End time must be after start time";
      }

      if (checkTimeOverlap()) {
        newErrors.timeOverlap =
          "This time slot overlaps with an existing habit";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        frequency: form.frequency,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
      };

      if (habit) {
        await api.patch(`/habits/${habit._id}`, payload);
        toast.success("Habit updated!");
      } else {
        await api.post("/habits", payload);
        toast.success("Habit created! 🎉");
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.response?.data?.message || "Failed to save habit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="font-bold text-gray-900 dark:text-white">
            {habit ? "Edit Habit" : "Create New Habit"}
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
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Habit Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Morning Meditation"
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
              placeholder="Describe what you'll do during this habit..."
              className={`w-full px-3 py-2.5 rounded-xl border ${
                errors.description
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              } text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20`}
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
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Productivity">Productivity</option>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Wellness">Wellness</option>
                <option value="Exercise">Exercise</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Daily">Daily</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Weekends">Weekends</option>
                <option value="3x per week">3x per week</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                <FaClock className="text-blue-600" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.timeStart}
                onChange={(e) =>
                  setForm({ ...form, timeStart: e.target.value })
                }
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.timeStart
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                } text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.timeStart && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.timeStart}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                <FaClock className="text-blue-600" />
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.timeEnd}
                onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.timeEnd
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                } text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.timeEnd && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.timeEnd}
                </p>
              )}
              {errors.timeOverlap && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.timeOverlap}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ✅ <strong>Time slots for scheduling:</strong> Choose a time
              window to organize your day. You can complete the habit anytime!
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
            {loading ? "Saving..." : habit ? "Update Habit" : "Create Habit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkGoalModal({
  habit,
  onClose,
  onSave,
}: {
  habit: Habit;
  onClose: () => void;
  onSave: () => void;
}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const res = await api.get("/goals");
        if (res.data.success) {
          const activeGoals = res.data.data.filter(
            (g: Goal) => g.status === "active" && g._id !== habit.linkedGoal,
          );
          setGoals(activeGoals);
        }
      } catch (err) {
        toast.error("Failed to load goals");
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [habit.linkedGoal]);

  const handleLink = async () => {
    if (!selectedGoal) {
      toast.error("Please select a goal");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/habits/${habit._id}/link`, { goalId: selectedGoal });
      toast.success("✅ Habit linked to goal!");
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to link habit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">
            Link to Goal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select an active goal to link this habit to:
          </p>

          {goals.length === 0 ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                No active goals available. Create or activate a goal first.
              </p>
            </div>
          ) : (
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a goal --</option>
              {goals.map((goal) => (
                <option key={goal._id} value={goal._id}>
                  {goal.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="p-5 pt-0 flex gap-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedGoal || submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {submitting ? "Linking..." : "Link Habit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Helper: Get time window status (informational only)
const getTimeWindowStatus = (timeStart?: string, timeEnd?: string): string => {
  if (!timeStart || !timeEnd) return "";

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = timeStart.split(":").map(Number);
  const [endHour, endMin] = timeEnd.split(":").map(Number);
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;

  if (currentTime >= start && currentTime < end) {
    const minutesLeft = end - currentTime;
    const hours = Math.floor(minutesLeft / 60);
    const mins = minutesLeft % 60;
    return `Open now (${hours}h ${mins}m left)`;
  } else if (currentTime < start) {
    const minutesUntil = start - currentTime;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    return `Starts in ${hours}h ${mins}m`;
  } else {
    return "Finished for today";
  }
};

function HabitCard({
  habit,
  onEdit,
  onDelete,
  onUnlink,
  onComplete,
  onLinkGoal,
}: {
  habit: Habit;
  onEdit: (h: Habit) => void;
  onDelete: (id: string) => void;
  onUnlink: (id: string) => void;
  onComplete: (id: string) => void;
  onLinkGoal: (h: Habit) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [localCompletedToday, setLocalCompletedToday] = useState(false);

  // ✅ FIXED: Get today's date string - CONSISTENT WITH BACKEND
  const today = getTodayString();

  // ✅ FIXED: Safely find today's tracking with proper date comparison
  const todayTracking = habit.tracking?.find((t) => {
    const trackingDateStr = getTrackingDateString(t.date);
    return trackingDateStr === today;
  });

  // ✅ Use local state OR server state (whichever is completed)
  const isCompletedToday =
    localCompletedToday || todayTracking?.status === "completed";
  const isMissedToday = todayTracking?.status === "missed";

  const timeWindowStatus = getTimeWindowStatus(habit.timeStart, habit.timeEnd);

  const sortedTracking = habit.tracking
    ? [...habit.tracking].sort((a, b) => {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        return bDate - aDate;
      })
    : [];

  const completedCount =
    habit.tracking?.filter((t) => t.status === "completed").length || 0;
  const missedCount =
    habit.tracking?.filter((t) => t.status === "missed").length || 0;

  // ✅ Handle completion with optimistic UI update
  const handleCompleteClick = async () => {
    // Guard clause: Already completing or completed
    if (isCompleting || isCompletedToday) {
      return;
    }

    // Set local state immediately (optimistic update)
    setIsCompleting(true);
    setLocalCompletedToday(true);

    try {
      await onComplete(habit._id);
      // Success - UI already updated optimistically
    } catch (error) {
      // Revert optimistic update on error
      console.error("Error marking habit complete:", error);
      setLocalCompletedToday(false);
      setIsCompleting(false);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isCompletedToday
          ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 shadow-md"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-md"
      }`}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Title + Status Badge */}
            <div className="flex items-center gap-3 mb-2">
              <h3
                className={`font-bold text-base ${
                  isCompletedToday
                    ? "text-green-700 dark:text-green-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {habit.title}
              </h3>
              {isCompletedToday && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <FaCheck className="text-xs" /> Done Today
                </span>
              )}
              {isMissedToday && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full font-semibold">
                  ❌ Missed
                </span>
              )}
            </div>

            {/* Category & Frequency Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">
                {habit.category}
              </span>
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium">
                {habit.frequency}
              </span>
              {habit.linkedGoal && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                  <FaLink className="text-xs" /> Linked Goal
                </span>
              )}
            </div>

            {/* Description - Better Layout */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                {habit.description}
              </p>
            </div>
          </div>

          {/* Action Buttons - Vertical Stack */}
          <div className="flex flex-col gap-2">
            {!isCompletedToday && !isMissedToday && (
              <button
                onClick={handleCompleteClick}
                disabled={isCompleting || isCompletedToday}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
              >
                <FaCheck className="text-sm" />
                {isCompleting ? "..." : "Mark"}
              </button>
            )}

            {!habit.linkedGoal && (
              <button
                onClick={() => onLinkGoal(habit)}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Link to goal"
              >
                <FaLink className="text-sm" />
              </button>
            )}

            {habit.linkedGoal && (
              <button
                onClick={() => onUnlink(habit._id)}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                title="Unlink from goal"
              >
                <FaUnlink className="text-sm" />
              </button>
            )}

            <button
              onClick={() => onEdit(habit)}
              className="px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <FaEdit className="text-sm" />
            </button>

            <button
              onClick={() => onDelete(habit._id)}
              className="px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FaTrash className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
     

      {/* Stats Section */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-bold text-green-600 dark:text-green-400">
              {completedCount}
            </span>{" "}
            completed •{" "}
            <span className="font-bold text-red-600 dark:text-red-400">
              {missedCount}
            </span>{" "}
            missed
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
        >
          <FaHistory className="text-xs" />
          {expanded ? "Hide" : "View"} History
        </button>
      </div>

      {/* Link Goal Info */}
      {habit.linkedGoal && habit.linkedGoalTitle && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>📌 Linked to:</strong> {habit.linkedGoalTitle}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            ✨ Completing this habit boosts your alignment score
          </p>
        </div>
      )}

      {/* History Section */}
      {expanded && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-3">
            📋 All Tracking History
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedTracking.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No tracking history yet
              </p>
            ) : (
              sortedTracking.map((record, idx) => {
                const recordDateStr = getTrackingDateString(record.date);
                const displayDate = recordDateStr
                  ? new Date(recordDateStr + "T00:00:00").toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        weekday: "short",
                      },
                    )
                  : "Unknown date";

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium ${
                      record.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : record.status === "missed"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{displayDate}</span>
                    <span>
                      {record.status === "completed"
                        ? "✅"
                        : record.status === "missed"
                          ? "❌"
                          : "⏳"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [selectedHabitForLink, setSelectedHabitForLink] =
    useState<Habit | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/habits");
      if (res.data.success) {
        setHabits(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (habitId: string) => {
    if (!window.confirm("Delete this habit?")) return;
    try {
      await api.delete(`/habits/${habitId}`);
      toast.success("Habit deleted");
      load();
    } catch (err: any) {
      toast.error("Failed to delete habit");
    }
  };

  const handleUnlink = async (habitId: string) => {
    try {
      await api.patch(`/habits/${habitId}/unlink`);
      toast.success("Habit unlinked from goal");
      load();
    } catch (err: any) {
      toast.error("Failed to unlink habit");
    }
  };

  // ✅ UPDATED: handleComplete with IMMEDIATE state update
  const handleComplete = async (habitId: string) => {
    try {
      const res = await api.patch(`/habits/${habitId}/complete`);

      if (!res.data.success) {
        if (res.data.isAlreadyCompleted) {
          toast.error("Habit already completed today!");
        } else {
          toast.error(res.data.message || "Failed to mark habit complete");
        }
        return;
      }

      // ✅ IMMEDIATELY update local state
      setHabits((prevHabits) =>
        prevHabits.map((h) =>
          h._id === habitId ? { ...h, ...res.data.data } : h,
        ),
      );

      toast.success("✅ Habit marked complete for today!");
      triggerDashboardRefresh();
      load();
    } catch (err: any) {
      console.error("Completion error:", err);
      toast.error(
        err.response?.data?.message || "Failed to mark habit complete",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const linkedHabits = habits.filter((h) => h.linkedGoal);
  const standaloneHabits = habits.filter((h) => !h.linkedGoal);
  const totalHabits = habits.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Habits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Build consistency with daily habits
          </p>
        </div>
        <button
          onClick={() => {
            setEditHabit(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FaPlus className="text-xs" /> New Habit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">
            Total Habits
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {totalHabits}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
            🎯 Goal-Linked
          </p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {linkedHabits.length}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Boost alignment score
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 font-semibold">
            🏃 Standalone
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {standaloneHabits.length}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Day-to-day tracking
          </p>
        </div>
      </div>

      {/* GOAL-LINKED HABITS SECTION */}
      {linkedHabits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🎯 Goal-Linked Habits ({linkedHabits.length})
          </h2>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800 mb-3">
            <p className="text-xs text-purple-700 dark:text-purple-300">
              <strong>
                ✨ These habits contribute to your alignment score
              </strong>{" "}
              and help you achieve your goals. Complete these to boost your
              daily alignment!
            </p>
          </div>
          <div className="space-y-3">
            {linkedHabits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onEdit={(h) => {
                  setEditHabit(h);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onUnlink={handleUnlink}
                onComplete={handleComplete}
                onLinkGoal={(h) => {
                  setSelectedHabitForLink(h);
                  setShowLinkModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* STANDALONE HABITS SECTION */}
      {standaloneHabits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🏃 Standalone Habits ({standaloneHabits.length})
          </h2>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 mb-3">
            <p className="text-xs text-green-700 dark:text-green-300">
              <strong>📌 Tracked independently</strong> and not connected to any
              goal. Perfect for habits you want to maintain separately!
            </p>
          </div>
          <div className="space-y-3">
            {standaloneHabits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onEdit={(h) => {
                  setEditHabit(h);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onUnlink={handleUnlink}
                onComplete={handleComplete}
                onLinkGoal={(h) => {
                  setSelectedHabitForLink(h);
                  setShowLinkModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {totalHabits === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No habits yet. Create your first habit to get started! 🚀
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/50">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
          💡 How Habits Work
        </h3>
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2">
          <div>
            <strong>✅ Anytime Completion:</strong> Mark habits as complete
            anytime during the day. Time windows are just for scheduling
            reference!
          </div>
          <div>
            <strong>🎯 Goal-Linked Habits:</strong> Link habits to active goals
            to track progress and boost your alignment score. These show on your
            dashboard!
          </div>
          <div>
            <strong>🏃 Standalone Habits:</strong> Track habits independently.
            Perfect for personal wellness routines that aren't tied to specific
            goals.
          </div>
          <div>
            <strong>⏰ Time Windows:</strong> Choose a time to organize your
            day. Complete the habit anytime works for you!
          </div>
          <div>
            <strong>📊 Tracking:</strong> View full history by expanding any
            habit card. See completed, missed, and pending records.
          </div>
          <div>
            <strong>⚡ Real-Time Sync:</strong> Dashboard updates instantly when
            you complete habits! Completion persists across page refreshes.
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <HabitModal
          habit={editHabit}
          existingHabits={habits}
          onClose={() => {
            setShowModal(false);
            setEditHabit(null);
          }}
          onSave={load}
        />
      )}

      {showLinkModal && selectedHabitForLink && (
        <LinkGoalModal
          habit={selectedHabitForLink}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedHabitForLink(null);
          }}
          onSave={load}
        />
      )}
    </div>
  );
}
