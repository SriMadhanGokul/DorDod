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
} from "react-icons/fa";

interface SubGoal {
  _id: string;
  name: string;
  description: string;
  status: string;
  expectedDueDate?: string;
  weightage?: number;
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

const emptyGoal = {
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

const emptySubGoal = {
  name: "",
  description: "",
  expectedDueDate: "",
  weightage: 0,
  measurementCriteria: "",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState(emptyGoal);
  const [newSub, setNewSub] = useState(emptySubGoal);
  const [saving, setSaving] = useState(false);

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

  const addGoal = async () => {
    if (!newGoal.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const res = await api.post("/goals", newGoal);
      setGoals((p) => [res.data.data, ...p]);
      setNewGoal(emptyGoal);
      setShowModal(false);
      toast.success("Goal created!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const addSubGoal = async (goalId: string) => {
    if (!newSub.name.trim()) return toast.error("Sub-goal name is required");
    setSaving(true);
    try {
      const res = await api.post(`/goals/${goalId}/subgoals`, newSub);
      setGoals((p) => p.map((g) => (g._id === goalId ? res.data.data : g)));
      setNewSub(emptySubGoal);
      setShowSubModal(null);
      toast.success("Sub-goal added!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const updateProgress = async (goal: Goal, progress: number) => {
    try {
      const res = await api.put(`/goals/${goal._id}`, { progress });
      setGoals((p) => p.map((g) => (g._id === goal._id ? res.data.data : g)));
    } catch {
      toast.error("Failed to update");
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals((p) => p.filter((g) => g._id !== id));
      toast.success("Goal deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const deleteSubGoal = async (goalId: string, subId: string) => {
    try {
      const res = await api.delete(`/goals/${goalId}/subgoals/${subId}`);
      setGoals((p) => p.map((g) => (g._id === goalId ? res.data.data : g)));
      toast.success("Sub-goal deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const priorityColor = (p: string) =>
    p === "High"
      ? "bg-destructive/10 text-destructive"
      : p === "Medium"
        ? "bg-secondary/20 text-secondary-foreground"
        : "bg-muted text-foreground-muted";

  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Goals</h1>
            <p className="text-foreground-muted mt-1">Track your progress</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> New Goal
          </button>
        </div>

        {/* Status filters */}
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

        {/* Category filters */}
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
        {!loading && goals.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <p className="text-lg font-medium">No goals yet</p>
            <p className="text-sm mt-1">Create your first goal!</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((goal) => (
            <div key={goal._id} className="card-elevated">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <div className="flex gap-1 mt-1">
                    <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">
                      {goal.category}
                    </span>
                    <span className="text-xs bg-muted text-foreground-muted px-2 py-0.5 rounded-full">
                      {goal.goalType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor(goal.priority)}`}
                  >
                    {goal.priority}
                  </span>
                  <button
                    onClick={() => deleteGoal(goal._id)}
                    className="text-foreground-muted hover:text-destructive"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-foreground-muted mb-3">
                {goal.description}
              </p>

              <input
                type="range"
                min={0}
                max={100}
                value={goal.progress}
                onChange={(e) => updateProgress(goal, +e.target.value)}
                className="w-full accent-primary mb-2"
              />
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${goal.progress === 100 ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-foreground-muted mb-3">
                <span>{goal.progress}%</span>
                <span>{goal.status}</span>
              </div>

              {/* Sub-goals toggle */}
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
                    Sub-goals ({goal.subGoals.length})
                  </button>
                  <div className="flex items-center gap-2">
                    {/* Learn button */}
                    <button
                      onClick={() =>
                        navigate(
                          `/learning?skill=${encodeURIComponent(goal.title.replace(/^Learn\s+/i, ""))}`,
                        )
                      }
                      title="Find learning resources for this goal"
                      className="text-xs bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground px-2 py-1 rounded-lg transition-all flex items-center gap-1 font-medium"
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

                {expandedGoal === goal._id && goal.subGoals.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {goal.subGoals.map((sub) => (
                      <div
                        key={sub._id}
                        className="flex justify-between items-center bg-muted rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-medium">{sub.name}</p>
                          <span
                            className={`text-xs ${sub.status === "Completed" ? "text-success" : "text-foreground-muted"}`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteSubGoal(goal._id, sub._id)}
                          className="text-foreground-muted hover:text-destructive"
                        >
                          <FaTrash className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Goal Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">New Goal</h2>
                <button onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newGoal.goalType}
                    onChange={(e) =>
                      setNewGoal((p) => ({ ...p, goalType: e.target.value }))
                    }
                    className="input-field"
                  >
                    <option>Personal</option>
                    <option>Professional</option>
                  </select>
                  <select
                    value={newGoal.category}
                    onChange={(e) =>
                      setNewGoal((p) => ({ ...p, category: e.target.value }))
                    }
                    className="input-field"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <input
                  placeholder="Goal title *"
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal((p) => ({ ...p, title: e.target.value }))
                  }
                  className="input-field"
                />
                <textarea
                  placeholder="Description"
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal((p) => ({ ...p, description: e.target.value }))
                  }
                  className="input-field min-h-[70px]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newGoal.priority}
                    onChange={(e) =>
                      setNewGoal((p) => ({
                        ...p,
                        priority: e.target.value as Goal["priority"],
                      }))
                    }
                    className="input-field"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <input
                    placeholder="Coach (optional)"
                    value={newGoal.coach}
                    onChange={(e) =>
                      setNewGoal((p) => ({ ...p, coach: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newGoal.startDate}
                      onChange={(e) =>
                        setNewGoal((p) => ({ ...p, startDate: e.target.value }))
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newGoal.expectedEndDate}
                      onChange={(e) =>
                        setNewGoal((p) => ({
                          ...p,
                          expectedEndDate: e.target.value,
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                </div>
                <input
                  placeholder="Measurement Criteria"
                  value={newGoal.measurementCriteria}
                  onChange={(e) =>
                    setNewGoal((p) => ({
                      ...p,
                      measurementCriteria: e.target.value,
                    }))
                  }
                  className="input-field"
                />
                <button
                  onClick={addGoal}
                  disabled={saving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Goal"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Sub-goal Modal */}
        {showSubModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Add Sub-Goal</h2>
                <button onClick={() => setShowSubModal(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Sub-goal name *"
                  value={newSub.name}
                  onChange={(e) =>
                    setNewSub((p) => ({ ...p, name: e.target.value }))
                  }
                  className="input-field"
                />
                <textarea
                  placeholder="Description"
                  value={newSub.description}
                  onChange={(e) =>
                    setNewSub((p) => ({ ...p, description: e.target.value }))
                  }
                  className="input-field min-h-[60px]"
                />
                <div>
                  <label className="text-xs text-foreground-muted">
                    Expected Due Date
                  </label>
                  <input
                    type="date"
                    value={newSub.expectedDueDate}
                    onChange={(e) =>
                      setNewSub((p) => ({
                        ...p,
                        expectedDueDate: e.target.value,
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <input
                  placeholder="Measurement Criteria"
                  value={newSub.measurementCriteria}
                  onChange={(e) =>
                    setNewSub((p) => ({
                      ...p,
                      measurementCriteria: e.target.value,
                    }))
                  }
                  className="input-field"
                />
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
      </div>
    </DashboardLayout>
  );
}
