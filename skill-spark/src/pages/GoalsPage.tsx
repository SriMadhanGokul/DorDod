import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTimes,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaPlay,
  FaEdit,
  FaLock,
} from "react-icons/fa";

interface SubGoal {
  _id: string;
  name: string;
  description: string;
  status: string;
  expectedDueDate?: string;
  weightage?: number;
  measurementCriteria?: string;
}
interface Goal {
  _id: string;
  title: string;
  description: string;
  progress: number;
  priority: "High" | "Medium" | "Low";
  status: "In Progress" | "Completed" | "Not Started" | "On Hold";
  category: string;
  goalType: string;
  tags: string[];
  startDate?: string;
  expectedEndDate?: string;
  coach?: string;
  weightage?: number;
  measurementCriteria?: string;
  subGoals: SubGoal[];
}

const CATEGORIES = [
  "Spiritual",
  "Fitness",
  "Family",
  "Career",
  "Financial",
  "Social",
  "Intellectual",
  "Other",
];
const STATUSES = ["All", "In Progress", "Completed", "Not Started", "On Hold"];
const GOAL_TYPES = ["Personal", "Professional"];

const EMPTY_GOAL = {
  title: "",
  description: "",
  priority: "Medium" as Goal["priority"],
  category: "Career",
  goalType: "Personal",
  startDate: "",
  expectedEndDate: "",
  coach: "",
  weightage: 0,
  measurementCriteria: "",
};
const EMPTY_SUB = {
  name: "",
  description: "",
  expectedDueDate: "",
  weightage: 0,
  measurementCriteria: "",
};

const PC = (p: string) =>
  p === "High"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : p === "Medium"
      ? "bg-secondary/20 text-secondary-foreground border-secondary/20"
      : "bg-muted text-foreground-muted border-border";

const SC = (s: string) =>
  s === "Completed"
    ? "text-success bg-success/10 px-2 py-0.5 rounded-full text-xs font-medium"
    : s === "In Progress"
      ? "text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs font-medium"
      : s === "On Hold"
        ? "text-secondary bg-secondary/10 px-2 py-0.5 rounded-full text-xs font-medium"
        : "text-foreground-muted bg-muted px-2 py-0.5 rounded-full text-xs font-medium";

export default function GoalsPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_GOAL);
  const [editSubGoal, setEditSubGoal] = useState<{
    goalId: string;
    sub: SubGoal;
  } | null>(null);
  const [editSubForm, setEditSubForm] = useState(EMPTY_SUB as any);

  const [newGoal, setNewGoal] = useState(EMPTY_GOAL);
  const [newSub, setNewSub] = useState(EMPTY_SUB as any);

  useEffect(() => {
    api
      .get("/goals")
      .then((r) => setGoals(r.data.data))
      .catch(() => toast.error("Failed to load goals"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = goals.filter(
    (g) =>
      (filter === "All" || g.status === filter) &&
      (catFilter === "All" || g.category === catFilter),
  );

  // Validate mandatory fields
  const validateGoal = (g: typeof EMPTY_GOAL) => {
    if (!g.title.trim()) return "Goal title is required";
    if (!g.description.trim()) return "Description is required";
    if (!g.category) return "Category is required";
    if (!g.goalType) return "Goal type is required";
    if (!g.priority) return "Priority is required";
    if (!g.startDate) return "Start date is required";
    if (!g.expectedEndDate) return "End date is required";
    if (!g.measurementCriteria.trim())
      return "Measurement criteria is required";
    return null;
  };

  // ── CREATE ─────────────────────────────────────────────────────────────────
  const addGoal = async () => {
    const err = validateGoal(newGoal);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.post("/goals", {
        ...newGoal,
        status: "Not Started",
        progress: 0,
      });
      setGoals((p) => [res.data.data, ...p]);
      setNewGoal(EMPTY_GOAL);
      setShowModal(false);
      toast.success("Goal created!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT ───────────────────────────────────────────────────────────────────
  const openEdit = (goal: Goal) => {
    setEditGoal(goal);
    setEditForm({
      title: goal.title,
      description: goal.description,
      priority: goal.priority,
      category: goal.category,
      goalType: goal.goalType,
      startDate: goal.startDate?.slice(0, 10) || "",
      expectedEndDate: goal.expectedEndDate?.slice(0, 10) || "",
      coach: goal.coach || "",
      weightage: goal.weightage || 0,
      measurementCriteria: goal.measurementCriteria || "",
    });
  };

  const saveEdit = async () => {
    if (!editGoal) return;
    const err = validateGoal(editForm);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.put(`/goals/${editGoal._id}`, editForm);
      setGoals((p) =>
        p.map((g) => (g._id === editGoal._id ? res.data.data : g)),
      );
      setEditGoal(null);
      toast.success("Goal updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE (block if completed) ────────────────────────────────────────────
  const deleteGoal = async (goal: Goal) => {
    if (goal.status === "Completed")
      return toast.error("🔒 Completed goals cannot be deleted");
    if (!confirm("Delete this goal?")) return;
    try {
      await api.delete(`/goals/${goal._id}`);
      setGoals((p) => p.filter((g) => g._id !== goal._id));
      toast.success("Goal deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ── PROGRESS ───────────────────────────────────────────────────────────────
  const updateProgress = async (goal: Goal, progress: number) => {
    try {
      const res = await api.put(`/goals/${goal._id}`, { progress });
      setGoals((p) => p.map((g) => (g._id === goal._id ? res.data.data : g)));
    } catch {
      toast.error("Failed to update");
    }
  };

  // ── SUB-GOALS ──────────────────────────────────────────────────────────────
  const addSubGoal = async (goalId: string) => {
    if (!newSub.name.trim()) return toast.error("Sub-goal name is required");
    setSaving(true);
    try {
      const res = await api.post(`/goals/${goalId}/subgoals`, newSub);
      setGoals((p) => p.map((g) => (g._id === goalId ? res.data.data : g)));
      setNewSub(EMPTY_SUB);
      setShowSubModal(null);
      toast.success("Sub-goal added!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const openEditSub = (goalId: string, sub: SubGoal) => {
    setEditSubGoal({ goalId, sub });
    setEditSubForm({
      name: sub.name,
      description: sub.description || "",
      expectedDueDate: sub.expectedDueDate?.slice(0, 10) || "",
      measurementCriteria: sub.measurementCriteria || "",
    });
  };

  const saveEditSub = async () => {
    if (!editSubGoal) return;
    if (!editSubForm.name.trim())
      return toast.error("Sub-goal name is required");
    setSaving(true);
    try {
      const res = await api.put(
        `/goals/${editSubGoal.goalId}/subgoals/${editSubGoal.sub._id}`,
        editSubForm,
      );
      setGoals((p) =>
        p.map((g) => (g._id === editSubGoal.goalId ? res.data.data : g)),
      );
      setEditSubGoal(null);
      toast.success("Sub-goal updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteSubGoal = async (goalId: string, sub: SubGoal) => {
    if (sub.status === "Completed")
      return toast.error("🔒 Completed sub-goals cannot be deleted");
    try {
      const res = await api.delete(`/goals/${goalId}/subgoals/${sub._id}`);
      setGoals((p) => p.map((g) => (g._id === goalId ? res.data.data : g)));
      toast.success("Sub-goal deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ── FORM FIELDS helper ─────────────────────────────────────────────────────
  const GoalFormFields = ({
    form,
    setForm,
    prefix = "",
  }: {
    form: any;
    setForm: any;
    prefix?: string;
  }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Goal Type <span className="text-destructive">*</span>
          </label>
          <select
            value={form.goalType}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, goalType: e.target.value }))
            }
            className="input-field mt-1"
          >
            {GOAL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, category: e.target.value }))
            }
            className="input-field mt-1"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Goal Title <span className="text-destructive">*</span>
        </label>
        <input
          placeholder="What do you want to achieve?"
          value={form.title}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, title: e.target.value }))
          }
          className="input-field mt-1"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          placeholder="Describe your goal in detail..."
          value={form.description}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, description: e.target.value }))
          }
          className="input-field min-h-[70px] mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Priority <span className="text-destructive">*</span>
          </label>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, priority: e.target.value }))
            }
            className="input-field mt-1"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Coach (optional)
          </label>
          <input
            placeholder="Coach name"
            value={form.coach}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, coach: e.target.value }))
            }
            className="input-field mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Start Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, startDate: e.target.value }))
            }
            className="input-field mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            End Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={form.expectedEndDate}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, expectedEndDate: e.target.value }))
            }
            className="input-field mt-1"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Measurement Criteria <span className="text-destructive">*</span>
        </label>
        <input
          placeholder="How will you measure success?"
          value={form.measurementCriteria}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, measurementCriteria: e.target.value }))
          }
          className="input-field mt-1"
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Goals</h1>
            <p className="text-foreground-muted mt-1">
              Track your progress toward what matters most
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> New Goal
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === c ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground-muted hover:bg-accent"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <p className="text-lg font-medium">No goals found</p>
            <p className="text-sm mt-1">
              Create your first goal to get started!
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((goal) => (
            <div
              key={goal._id}
              className={`card-elevated ${goal.status === "Completed" ? "border-success/40 bg-success/5" : ""}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold">{goal.title}</h3>
                    {goal.status === "Completed" && (
                      <FaLock
                        className="text-success w-3 h-3"
                        title="Completed — protected"
                      />
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {goal.category}
                    </span>
                    <span className="text-xs bg-muted text-foreground-muted px-2 py-0.5 rounded-full">
                      {goal.goalType}
                    </span>
                    <span className={SC(goal.status)}>{goal.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PC(goal.priority)}`}
                  >
                    {goal.priority}
                  </span>
                  {/* Edit button — always visible */}
                  <button
                    onClick={() => openEdit(goal)}
                    title="Edit goal"
                    className="text-foreground-muted hover:text-primary p-1 hover:bg-primary/10 rounded-lg transition-all"
                  >
                    <FaEdit className="w-3.5 h-3.5" />
                  </button>
                  {/* Delete — blocked if completed */}
                  {goal.status === "Completed" ? (
                    <span
                      title="Completed goals cannot be deleted"
                      className="text-success p-1 cursor-not-allowed opacity-60"
                    >
                      <FaLock className="w-3 h-3" />
                    </span>
                  ) : (
                    <button
                      onClick={() => deleteGoal(goal)}
                      title="Delete goal"
                      className="text-foreground-muted hover:text-destructive p-1 hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {goal.description && (
                <p className="text-sm text-foreground-muted mb-3 line-clamp-2">
                  {goal.description}
                </p>
              )}

              {/* Progress — disabled if completed */}
              <div className="mb-3">
                {goal.status !== "Completed" && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={goal.progress}
                    onChange={(e) => updateProgress(goal, +e.target.value)}
                    className="w-full accent-primary mb-2"
                  />
                )}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${goal.progress === 100 ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-foreground-muted mt-1">
                  <span>{goal.progress}%</span>
                  {goal.expectedEndDate && (
                    <span>
                      📅 {new Date(goal.expectedEndDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-goals */}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() =>
                      setExpandedGoal(
                        expandedGoal === goal._id ? null : goal._id,
                      )
                    }
                    className="text-xs text-primary font-medium flex items-center gap-1"
                  >
                    {expandedGoal === goal._id ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                    Sub-goals ({goal.subGoals?.length || 0})
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/learning?skill=${encodeURIComponent(goal.title.replace(/^Learn\s+/i, ""))}`,
                        )
                      }
                      className="text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                    >
                      <FaPlay className="w-2 h-2" /> Learn
                    </button>
                    <button
                      onClick={() => setShowSubModal(goal._id)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <FaPlus className="w-2.5 h-2.5" /> Add
                    </button>
                  </div>
                </div>
                {expandedGoal === goal._id && goal.subGoals?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {goal.subGoals.map((sub) => (
                      <div
                        key={sub._id}
                        className={`flex justify-between items-center rounded-lg px-3 py-2 ${sub.status === "Completed" ? "bg-success/10 border border-success/20" : "bg-muted"}`}
                      >
                        <div>
                          <p className="text-xs font-medium">{sub.name}</p>
                          <span
                            className={`text-xs ${sub.status === "Completed" ? "text-success font-medium" : "text-foreground-muted"}`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditSub(goal._id, sub)}
                            className="text-foreground-muted hover:text-primary p-1"
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                          {sub.status === "Completed" ? (
                            <span
                              title="Completed"
                              className="text-success p-1 cursor-not-allowed opacity-50"
                            >
                              <FaLock className="w-2.5 h-2.5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => deleteSubGoal(goal._id, sub)}
                              className="text-foreground-muted hover:text-destructive p-1"
                            >
                              <FaTrash className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Create Goal Modal ─────────────────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-6 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-lg my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">New Goal</h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <GoalFormFields form={newGoal} setForm={setNewGoal} />
              <button
                onClick={addGoal}
                disabled={saving}
                className="btn-primary w-full mt-4 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Goal"}
              </button>
            </div>
          </div>
        )}

        {/* ── Edit Goal Modal ───────────────────────────────────────────── */}
        {editGoal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-6 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-lg my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaEdit className="text-primary" /> Edit Goal
                </h2>
                <button onClick={() => setEditGoal(null)}>
                  <FaTimes />
                </button>
              </div>
              <GoalFormFields form={editForm} setForm={setEditForm} />
              {/* Status update in edit */}
              <div className="mt-3">
                <label className="text-xs font-medium text-foreground-muted">
                  Status
                </label>
                <select
                  value={editGoal.status}
                  onChange={(e) =>
                    setEditGoal((p) =>
                      p
                        ? { ...p, status: e.target.value as Goal["status"] }
                        : p,
                    )
                  }
                  className="input-field mt-1"
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>On Hold</option>
                </select>
              </div>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="btn-primary w-full mt-4 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ── Add Sub-goal Modal ────────────────────────────────────────── */}
        {showSubModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Add Sub-Goal</h2>
                <button onClick={() => setShowSubModal(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    placeholder="Sub-goal name"
                    value={newSub.name}
                    onChange={(e) =>
                      setNewSub((p: any) => ({ ...p, name: e.target.value }))
                    }
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Description
                  </label>
                  <textarea
                    placeholder="Description"
                    value={newSub.description}
                    onChange={(e) =>
                      setNewSub((p: any) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="input-field min-h-[60px] mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Expected Due Date
                  </label>
                  <input
                    type="date"
                    value={newSub.expectedDueDate}
                    onChange={(e) =>
                      setNewSub((p: any) => ({
                        ...p,
                        expectedDueDate: e.target.value,
                      }))
                    }
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Measurement Criteria
                  </label>
                  <input
                    placeholder="How to measure this?"
                    value={newSub.measurementCriteria}
                    onChange={(e) =>
                      setNewSub((p: any) => ({
                        ...p,
                        measurementCriteria: e.target.value,
                      }))
                    }
                    className="input-field mt-1"
                  />
                </div>
                <button
                  onClick={() => addSubGoal(showSubModal)}
                  disabled={saving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Sub-Goal"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Sub-goal Modal ───────────────────────────────────────── */}
        {editSubGoal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaEdit className="text-primary" /> Edit Sub-Goal
                </h2>
                <button onClick={() => setEditSubGoal(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={editSubForm.name}
                    onChange={(e) =>
                      setEditSubForm((p: any) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Description
                  </label>
                  <textarea
                    value={editSubForm.description}
                    onChange={(e) =>
                      setEditSubForm((p: any) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="input-field min-h-[60px] mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Expected Due Date
                  </label>
                  <input
                    type="date"
                    value={editSubForm.expectedDueDate}
                    onChange={(e) =>
                      setEditSubForm((p: any) => ({
                        ...p,
                        expectedDueDate: e.target.value,
                      }))
                    }
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-muted">
                    Status
                  </label>
                  <select
                    value={editSubGoal.sub.status}
                    onChange={(e) =>
                      setEditSubGoal((p) =>
                        p
                          ? { ...p, sub: { ...p.sub, status: e.target.value } }
                          : p,
                      )
                    }
                    className="input-field mt-1"
                  >
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
                <button
                  onClick={saveEditSub}
                  disabled={saving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
