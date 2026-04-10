import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTimes,
  FaTrash,
  FaFire,
  FaTrophy,
  FaLightbulb,
  FaClock,
  FaCheck,
  FaCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface Activity {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "done";
  priority: "High" | "Medium" | "Low";
  dueDate?: string;
  goalId?: { _id: string; title: string; category: string };
  goalTitle: string;
  addedToHabit: boolean;
  addedToAchievement: boolean;
  autoSuggested: boolean;
}
interface Goal {
  _id: string;
  title: string;
  category: string;
}

const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    icon: FaCircle,
    color: "text-foreground-muted",
    bg: "bg-muted border-border",
    dot: "bg-muted-foreground",
  },
  inprogress: {
    label: "In Progress",
    icon: FaClock,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/30",
    dot: "bg-primary",
  },
  done: {
    label: "Done",
    icon: FaCheck,
    color: "text-success",
    bg: "bg-success/10 border-success/30",
    dot: "bg-success",
  },
};
const PRIORITY_COLOR = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-secondary/20 text-secondary-foreground",
  Low: "bg-muted text-foreground-muted",
};

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGoal, setFilterGoal] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string }[]>([]);
  const [suggestGoal, setSuggestGoal] = useState("");
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  // Habit schedule modal
  const [habitModal, setHabitModal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [frequency, setFrequency] = useState("daily");

  // Achievement modal
  const [achModal, setAchModal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [achDesc, setAchDesc] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    goalId: "",
    subGoalId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, gRes] = await Promise.all([
          api.get("/activities"),
          api.get("/goals"),
        ]);
        setActivities(aRes.data.data);
        setGoals(gRes.data.data);
        // expand all goal groups by default
        const ids = new Set<string>(
          aRes.data.data.map((a: Activity) => a.goalId?._id || "ungrouped"),
        );
        setExpandedGoals(ids);
      } catch {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchSuggestions = async (goalId: string) => {
    if (!goalId) return;
    try {
      const res = await api.get(`/activities/suggestions/${goalId}`);
      setSuggestions(res.data.data);
      setSuggestGoal(goalId);
      setShowSuggest(true);
    } catch {
      toast.error("Failed to load suggestions");
    }
  };

  const addSuggestion = async (title: string) => {
    try {
      const res = await api.post("/activities", {
        title,
        goalId: suggestGoal,
        autoSuggested: true,
        priority: "Medium",
      });
      setActivities((p) => [res.data.data, ...p]);
      toast.success("Activity added!");
    } catch {
      toast.error("Failed");
    }
  };

  const create = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const res = await api.post("/activities", form);
      setActivities((p) => [res.data.data, ...p]);
      setForm({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
        goalId: "",
        subGoalId: "",
      });
      setShowModal(false);
      toast.success("Activity created!");
    } catch {
      toast.error("Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/activities/${id}/status`, { status });
      setActivities((p) => p.map((a) => (a._id === id ? res.data.data : a)));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const addHabit = async () => {
    if (!habitModal) return;
    try {
      await api.post(`/activities/${habitModal.id}/add-habit`, {
        reminderTime,
        frequency,
      });
      setActivities((p) =>
        p.map((a) =>
          a._id === habitModal.id ? { ...a, addedToHabit: true } : a,
        ),
      );
      toast.success(`🔥 Habit created with daily reminder at ${reminderTime}!`);
      setHabitModal(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const addAchievement = async () => {
    if (!achModal) return;
    try {
      await api.post(`/activities/${achModal.id}/add-achievement`, {
        description: achDesc,
      });
      setActivities((p) =>
        p.map((a) =>
          a._id === achModal.id ? { ...a, addedToAchievement: true } : a,
        ),
      );
      toast.success("🏆 Achievement created!");
      setAchModal(null);
      setAchDesc("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await api.delete(`/activities/${id}`);
      setActivities((p) => p.filter((a) => a._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const toggleGoal = (id: string) =>
    setExpandedGoals((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // Filter
  const filtered = activities.filter((a) => {
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchGoal = !filterGoal || a.goalId?._id === filterGoal;
    return matchStatus && matchGoal;
  });

  // Group by goal
  const grouped = filtered.reduce(
    (acc, a) => {
      const key = a.goalId?._id || "ungrouped";
      const label = a.goalTitle || a.goalId?.title || "No Goal";
      if (!acc[key]) acc[key] = { label, items: [] };
      acc[key].items.push(a);
      return acc;
    },
    {} as Record<string, { label: string; items: Activity[] }>,
  );

  const counts = {
    todo: filtered.filter((a) => a.status === "todo").length,
    inprogress: filtered.filter((a) => a.status === "inprogress").length,
    done: filtered.filter((a) => a.status === "done").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Activities</h1>
            <p className="text-foreground-muted mt-1">
              Action steps linked to your goals
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSuggest(true)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <FaLightbulb className="text-secondary" /> Suggest
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <FaPlus /> Add Activity
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "To Do",
              val: counts.todo,
              color: "text-foreground-muted",
              bg: "bg-muted",
            },
            {
              label: "In Progress",
              val: counts.inprogress,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Done",
              val: counts.done,
              color: "text-success",
              bg: "bg-success/10",
            },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-foreground-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {["all", "todo", "inprogress", "done"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
              >
                {s === "all" ? "All" : s === "inprogress" ? "In Progress" : s}
              </button>
            ))}
          </div>
          <select
            value={filterGoal}
            onChange={(e) => setFilterGoal(e.target.value)}
            className="input-field text-sm sm:w-48"
          >
            <option value="">All Goals</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <FaCircle className="text-4xl mx-auto mb-3 opacity-20" />
            <p className="font-medium">No activities yet</p>
            <p className="text-sm mt-1">
              Add activities or get suggestions based on your goals
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-sm"
              >
                + Add Activity
              </button>
              <button
                onClick={() => setShowSuggest(true)}
                className="btn-secondary text-sm"
              >
                💡 Get Suggestions
              </button>
            </div>
          </div>
        )}

        {/* Grouped activity cards */}
        {!loading &&
          Object.entries(grouped).map(([goalKey, group]) => (
            <div key={goalKey} className="card-elevated">
              {/* Group header */}
              <button
                onClick={() => toggleGoal(goalKey)}
                className="w-full flex items-center justify-between mb-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    🎯 {group.label}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    ({group.items.length})
                  </span>
                </div>
                {expandedGoals.has(goalKey) ? (
                  <FaChevronUp className="text-foreground-muted w-3 h-3" />
                ) : (
                  <FaChevronDown className="text-foreground-muted w-3 h-3" />
                )}
              </button>

              {expandedGoals.has(goalKey) && (
                <div className="space-y-2 mt-3">
                  {group.items.map((a) => {
                    // Normalise status — DB may have different casing/values
                    const rawStatus = (a.status || "todo")
                      .toLowerCase()
                      .replace(/[^a-z]/g, "");
                    const normalised =
                      rawStatus === "inprogress" || rawStatus === "inprog"
                        ? "inprogress"
                        : rawStatus === "done" || rawStatus === "completed"
                          ? "done"
                          : "todo";
                    const scfg =
                      STATUS_CONFIG[normalised] || STATUS_CONFIG["todo"];
                    return (
                      <div
                        key={a._id}
                        className={`p-3 rounded-xl border transition-all ${scfg?.bg || "bg-muted border-border"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${scfg?.dot || "bg-muted-foreground"}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${a.status === "done" ? "line-through opacity-60" : ""}`}
                              >
                                {a.title}
                              </p>
                              {a.description && (
                                <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">
                                  {a.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[a.priority]}`}
                                >
                                  {a.priority}
                                </span>
                                {a.dueDate && (
                                  <span className="text-xs text-foreground-muted">
                                    📅{" "}
                                    {new Date(a.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {a.autoSuggested && (
                                  <span className="text-xs bg-secondary/15 text-secondary px-2 py-0.5 rounded-full">
                                    💡 Suggested
                                  </span>
                                )}
                                {a.addedToHabit && (
                                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                                    🔥 In Habits
                                  </span>
                                )}
                                {a.addedToAchievement && (
                                  <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                                    🏆 Achievement
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Status cycle button */}
                            <select
                              value={normalised}
                              onChange={(e) =>
                                updateStatus(a._id, e.target.value)
                              }
                              className="text-xs border border-current rounded-lg px-2 py-1 bg-transparent cursor-pointer"
                            >
                              <option value="todo">⬜ To Do</option>
                              <option value="inprogress">🔄 In Progress</option>
                              <option value="done">✅ Done</option>
                            </select>

                            {/* Add to Habit */}
                            {!a.addedToHabit && (
                              <button
                                onClick={() =>
                                  setHabitModal({ id: a._id, title: a.title })
                                }
                                title="Add to Habits"
                                className="text-xs border border-border bg-card hover:border-destructive hover:text-destructive text-foreground-muted px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                              >
                                <FaFire className="w-2.5 h-2.5" /> Habit
                              </button>
                            )}

                            {/* Add to Achievement (only when done) */}
                            {a.status === "done" && !a.addedToAchievement && (
                              <button
                                onClick={() =>
                                  setAchModal({ id: a._id, title: a.title })
                                }
                                title="Create Achievement"
                                className="text-xs border border-border bg-card hover:border-secondary hover:text-secondary text-foreground-muted px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                              >
                                <FaTrophy className="w-2.5 h-2.5" /> Award
                              </button>
                            )}

                            <button
                              onClick={() => del(a._id)}
                              className="text-foreground-muted hover:text-destructive p-1"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

        {/* ── Create Activity Modal ─────────────────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FaPlus className="text-primary" /> New Activity
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Activity title *"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="input-field"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="input-field min-h-[60px]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">
                      Link to Goal
                    </label>
                    <select
                      value={form.goalId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, goalId: e.target.value }))
                      }
                      className="input-field"
                    >
                      <option value="">No Goal</option>
                      {goals.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, priority: e.target.value }))
                      }
                      className="input-field"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dueDate: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <button
                  onClick={create}
                  disabled={saving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Activity"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Suggestions Modal ─────────────────────────────────────────────── */}
        {showSuggest && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FaLightbulb className="text-secondary" /> Activity
                  Suggestions
                </h2>
                <button onClick={() => setShowSuggest(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-foreground-muted font-medium">
                    Choose a Goal to get suggestions for:
                  </label>
                  <select
                    onChange={(e) => fetchSuggestions(e.target.value)}
                    className="input-field mt-1"
                  >
                    <option value="">Select a goal...</option>
                    {goals.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-foreground-muted font-medium">
                      Suggested activities — click to add:
                    </p>
                    {suggestions.map((s, i) => {
                      const exists = activities.some(
                        (a) =>
                          a.title === s.title && a.goalId?._id === suggestGoal,
                      );
                      return (
                        <button
                          key={i}
                          disabled={exists}
                          onClick={() => addSuggestion(s.title)}
                          className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                            exists
                              ? "border-success/30 bg-success/10 text-success cursor-default"
                              : "border-border hover:border-primary hover:bg-primary/5"
                          }`}
                        >
                          {exists ? "✅" : "+"} {s.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Add to Habit Modal (with schedule) ───────────────────────────── */}
        {habitModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-sm my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <FaFire className="text-destructive" /> Add to Habits
                </h2>
                <button onClick={() => setHabitModal(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-sm font-medium">"{habitModal.title}"</p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    will become a daily habit
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Daily Reminder Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="input-field mt-1"
                  />
                  <p className="text-xs text-foreground-muted mt-1">
                    You'll be reminded at this time every day
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="input-field mt-1"
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays Only (Mon–Fri)</option>
                    <option value="weekends">Weekends Only (Sat–Sun)</option>
                  </select>
                </div>
                <button onClick={addHabit} className="btn-primary w-full">
                  🔥 Create Habit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Achievement Modal ─────────────────────────────────────────────── */}
        {achModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-sm my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <FaTrophy className="text-secondary" /> Create Achievement
                </h2>
                <button onClick={() => setAchModal(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-success/10 border border-success/30 rounded-xl p-3">
                  <p className="text-sm font-medium text-success">
                    🏆 "{achModal.title}"
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    This activity is done — award yourself!
                  </p>
                </div>
                <textarea
                  placeholder="Add a note about this achievement (optional)"
                  value={achDesc}
                  onChange={(e) => setAchDesc(e.target.value)}
                  className="input-field min-h-[70px]"
                />
                <button onClick={addAchievement} className="btn-primary w-full">
                  🏆 Award Achievement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
