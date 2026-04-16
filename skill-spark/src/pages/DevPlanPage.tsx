import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaRocket,
  FaClock,
  FaBook,
  FaBullseye,
  FaLightbulb,
  FaSync,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaLink,
  FaCalendar,
  FaLock,
} from "react-icons/fa";

const iconMap: Record<string, React.ElementType> = {
  FaBook,
  FaRocket,
  FaClock,
  FaBullseye,
  FaLightbulb,
  FaBookOpen: FaBook,
};

const PRIORITY_CFG = {
  high: {
    label: "High",
    color: "border-l-destructive",
    badge: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  medium: {
    label: "Medium",
    color: "border-l-primary",
    badge: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  low: {
    label: "Low",
    color: "border-l-muted",
    badge: "bg-muted text-foreground-muted",
    dot: "bg-muted-foreground",
  },
};

interface Rec {
  _id: string;
  title: string;
  type: string;
  duration: string;
  completed: boolean;
  icon: string;
  priority: string;
  reason: string;
  startDate?: string;
  endDate?: string;
  linkedCourse?: string;
  courseTitle?: string;
}
interface Milestone {
  _id: string;
  title: string;
  desc: string;
  done: boolean;
  startDate?: string;
  endDate?: string;
}
interface Course {
  _id: string;
  title: string;
}

const EMPTY_REC = {
  title: "",
  type: "Skill Practice",
  duration: "",
  priority: "medium",
  reason: "",
  startDate: "",
  endDate: "",
  linkedCourse: "",
  courseTitle: "",
};
const EMPTY_MS = { title: "", desc: "", startDate: "", endDate: "" };

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function DevPlanPage() {
  const [recommendations, setRecs] = useState<Rec[]>([]);
  const [milestones, setMs] = useState<Milestone[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Modals
  const [showAddRec, setShowAddRec] = useState(false);
  const [showAddMs, setShowAddMs] = useState(false);
  const [editRec, setEditRec] = useState<Rec | null>(null);
  const [editMs, setEditMs] = useState<Milestone | null>(null);
  const [recForm, setRecForm] = useState({ ...EMPTY_REC });
  const [msForm, setMsForm] = useState({ ...EMPTY_MS });

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const [planRes, courseRes] = await Promise.all([
        api.get("/devplan"),
        api.get("/learning"),
      ]);
      setRecs(planRes.data.data.recommendations || []);
      setMs(planRes.data.data.milestones || []);
      setCourses(courseRes.data.data || []);
    } catch {
      toast.error("Failed to load plan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.post("/devplan/refresh");
      setRecs(res.data.data.recommendations || []);
      setMs(res.data.data.milestones || []);
      toast.success("Plan refreshed from your latest data!");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  // Validate rec form
  const validateRec = (f: typeof EMPTY_REC) => {
    if (!f.title.trim()) return "Title is required";
    if (!f.type.trim()) return "Type is required";
    if (!f.priority) return "Priority is required";
    if (!f.startDate) return "Start date is required";
    if (!f.endDate) return "End date is required";
    return null;
  };

  const validateMs = (f: typeof EMPTY_MS) => {
    if (!f.title.trim()) return "Title is required";
    if (!f.startDate) return "Start date is required";
    if (!f.endDate) return "End date is required";
    return null;
  };

  // ── Recommendations CRUD ───────────────────────────────────────────────────
  const addRec = async () => {
    const err = validateRec(recForm);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.post("/devplan/recommendations", recForm);
      setRecs(res.data.data.recommendations);
      setRecForm({ ...EMPTY_REC });
      setShowAddRec(false);
      toast.success("Recommendation added!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const openEditRec = (r: Rec) => {
    setEditRec(r);
    setRecForm({
      title: r.title,
      type: r.type,
      duration: r.duration || "",
      priority: r.priority,
      reason: r.reason || "",
      startDate: r.startDate?.slice(0, 10) || "",
      endDate: r.endDate?.slice(0, 10) || "",
      linkedCourse: r.linkedCourse || "",
      courseTitle: r.courseTitle || "",
    });
  };

  const saveEditRec = async () => {
    if (!editRec) return;
    const err = validateRec(recForm);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.put(
        `/devplan/recommendations/${editRec._id}`,
        recForm,
      );
      setRecs(res.data.data.recommendations);
      setEditRec(null);
      toast.success("Updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteRec = async (r: Rec) => {
    if (r.completed) return toast.error("🔒 Completed items cannot be deleted");
    if (!confirm("Delete this recommendation?")) return;
    try {
      const res = await api.delete(`/devplan/recommendations/${r._id}`);
      setRecs(res.data.data.recommendations);
      toast.success("Deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const toggleRec = async (id: string) => {
    try {
      const res = await api.patch(`/devplan/recommendations/${id}/toggle`);
      setRecs(res.data.data.recommendations);
    } catch {
      toast.error("Failed");
    }
  };

  // ── Milestones CRUD ────────────────────────────────────────────────────────
  const addMs = async () => {
    const err = validateMs(msForm);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.post("/devplan/milestones", msForm);
      setMs(res.data.data.milestones);
      setMsForm({ ...EMPTY_MS });
      setShowAddMs(false);
      toast.success("Milestone added!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const openEditMs = (m: Milestone) => {
    setEditMs(m);
    setMsForm({
      title: m.title,
      desc: m.desc || "",
      startDate: m.startDate?.slice(0, 10) || "",
      endDate: m.endDate?.slice(0, 10) || "",
    });
  };

  const saveEditMs = async () => {
    if (!editMs) return;
    const err = validateMs(msForm);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await api.put(`/devplan/milestones/${editMs._id}`, msForm);
      setMs(res.data.data.milestones);
      setEditMs(null);
      toast.success("Updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteMs = async (m: Milestone) => {
    if (m.done) return toast.error("🔒 Completed milestones cannot be deleted");
    if (!confirm("Delete this milestone?")) return;
    try {
      const res = await api.delete(`/devplan/milestones/${m._id}`);
      setMs(res.data.data.milestones);
      toast.success("Deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  const toggleMs = async (id: string) => {
    try {
      const res = await api.patch(`/devplan/milestones/${id}/toggle`);
      setMs(res.data.data.milestones);
    } catch {
      toast.error("Failed");
    }
  };

  const completed = recommendations.filter((r) => r.completed).length;
  const total = recommendations.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const groups = [
    {
      label: "🔴 High Priority — Do These First",
      recs: recommendations.filter((r) => r.priority === "high"),
      cfg: PRIORITY_CFG.high,
    },
    {
      label: "🟡 Medium Priority",
      recs: recommendations.filter((r) => r.priority === "medium"),
      cfg: PRIORITY_CFG.medium,
    },
    {
      label: "🟢 Nice to Have",
      recs: recommendations.filter((r) => r.priority === "low"),
      cfg: PRIORITY_CFG.low,
    },
  ].filter((g) => g.recs.length > 0);

  // Shared Rec form fields
  const RecFormFields = ({ f, setF }: { f: any; setF: any }) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          placeholder="e.g. Complete React course"
          value={f.title}
          onChange={(e) => setF((p: any) => ({ ...p, title: e.target.value }))}
          className="input-field mt-1"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Type <span className="text-destructive">*</span>
          </label>
          <select
            value={f.type}
            onChange={(e) => setF((p: any) => ({ ...p, type: e.target.value }))}
            className="input-field mt-1"
          >
            <option>Skill Practice</option>
            <option>Course</option>
            <option>Goal</option>
            <option>Skill</option>
            <option>Project</option>
            <option>Reading</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Priority <span className="text-destructive">*</span>
          </label>
          <select
            value={f.priority}
            onChange={(e) =>
              setF((p: any) => ({ ...p, priority: e.target.value }))
            }
            className="input-field mt-1"
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Start Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={f.startDate}
            onChange={(e) =>
              setF((p: any) => ({ ...p, startDate: e.target.value }))
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
            value={f.endDate}
            onChange={(e) =>
              setF((p: any) => ({ ...p, endDate: e.target.value }))
            }
            className="input-field mt-1"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Duration
        </label>
        <input
          placeholder="e.g. 30 min/day, 2 weeks"
          value={f.duration}
          onChange={(e) =>
            setF((p: any) => ({ ...p, duration: e.target.value }))
          }
          className="input-field mt-1"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted flex items-center gap-1">
          <FaLink className="w-3 h-3" /> Link to Course (optional)
        </label>
        <select
          value={f.linkedCourse}
          onChange={(e) =>
            setF((p: any) => ({ ...p, linkedCourse: e.target.value }))
          }
          className="input-field mt-1"
        >
          <option value="">None</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Reason / Notes
        </label>
        <textarea
          placeholder="Why is this important?"
          value={f.reason}
          onChange={(e) => setF((p: any) => ({ ...p, reason: e.target.value }))}
          className="input-field min-h-[60px] mt-1"
        />
      </div>
    </div>
  );

  const MsFormFields = ({ f, setF }: { f: any; setF: any }) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Milestone Title <span className="text-destructive">*</span>
        </label>
        <input
          placeholder="e.g. Complete Foundation Phase"
          value={f.title}
          onChange={(e) => setF((p: any) => ({ ...p, title: e.target.value }))}
          className="input-field mt-1"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-muted">
          Description
        </label>
        <textarea
          placeholder="What does achieving this milestone look like?"
          value={f.desc}
          onChange={(e) => setF((p: any) => ({ ...p, desc: e.target.value }))}
          className="input-field min-h-[60px] mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground-muted">
            Start Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={f.startDate}
            onChange={(e) =>
              setF((p: any) => ({ ...p, startDate: e.target.value }))
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
            value={f.endDate}
            onChange={(e) =>
              setF((p: any) => ({ ...p, endDate: e.target.value }))
            }
            className="input-field mt-1"
          />
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              My Development Plan
            </h1>
            <p className="text-foreground-muted mt-1">
              Personalized plan built from your goals, skills & courses
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <FaSync className={refreshing ? "animate-spin" : ""} /> Refresh Plan
          </button>
        </div>

        {/* Overall progress */}
        <div className="card-elevated">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-sm text-foreground-muted">
              {completed}/{total} completed
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary to-success rounded-full h-3 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-foreground-muted mt-2">
            {pct}% of your plan done
          </p>
        </div>

        {/* Quick navigation */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Update Goals",
              icon: FaBullseye,
              path: "/goals",
              color: "bg-primary/10 text-primary hover:bg-primary/20",
            },
            {
              label: "Track Skills",
              icon: FaLightbulb,
              path: "/skills",
              color: "bg-secondary/10 text-secondary hover:bg-secondary/20",
            },
            {
              label: "View Courses",
              icon: FaBook,
              path: "/learning",
              color: "bg-success/10 text-success hover:bg-success/20",
            },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={() => navigate(btn.path)}
              className={`${btn.color} rounded-xl p-3 text-center text-xs font-medium transition-all flex flex-col items-center gap-1.5`}
            >
              <btn.icon className="text-lg" />
              {btn.label}
            </button>
          ))}
        </div>

        {/* ── RECOMMENDATIONS ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📋 Recommendations</h2>
            <button
              onClick={() => {
                setRecForm({ ...EMPTY_REC });
                setShowAddRec(true);
              }}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <FaPlus className="w-3 h-3" /> Add
            </button>
          </div>

          {groups.length === 0 && (
            <div className="text-center py-10 text-foreground-muted">
              <FaRocket className="text-4xl mx-auto mb-3 opacity-20" />
              <p className="font-medium">No recommendations yet</p>
              <p className="text-sm mt-1">
                Add goals, skills, and courses — or click Refresh Plan
              </p>
            </div>
          )}

          {groups.map((group, gi) => (
            <div key={gi} className="mb-6">
              <h3 className="font-semibold text-sm text-foreground-muted uppercase tracking-wide mb-3">
                {group.label}
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {group.recs.map((item) => {
                  const Icon = iconMap[item.icon] || FaBook;
                  return (
                    <div
                      key={item._id}
                      className={`card-elevated border-l-4 ${group.cfg.color} ${item.completed ? "opacity-70" : ""} transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.completed ? "bg-success/20 text-success" : "bg-primary/10 text-primary"}`}
                        >
                          <Icon className="text-base" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-semibold text-sm ${item.completed ? "line-through" : ""}`}
                              >
                                {item.title}
                              </h3>
                              <p className="text-xs text-foreground-muted mt-0.5">
                                {item.type}
                                {item.duration ? ` · ${item.duration}` : ""}
                              </p>
                              {item.reason && (
                                <p className="text-xs text-foreground-muted mt-1 italic">
                                  💡 {item.reason}
                                </p>
                              )}
                              {item.courseTitle && (
                                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                  <FaLink className="w-2.5 h-2.5" />{" "}
                                  {item.courseTitle}
                                </p>
                              )}
                              {(item.startDate || item.endDate) && (
                                <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1">
                                  <FaCalendar className="w-2.5 h-2.5" />
                                  {fmtDate(item.startDate)} —{" "}
                                  {fmtDate(item.endDate)}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => openEditRec(item)}
                                className="text-foreground-muted hover:text-primary p-1 hover:bg-primary/10 rounded-lg transition-all"
                              >
                                <FaEdit className="w-3.5 h-3.5" />
                              </button>
                              {item.completed ? (
                                <span
                                  title="Completed — cannot delete"
                                  className="text-success p-1 cursor-not-allowed opacity-50"
                                >
                                  <FaLock className="w-3 h-3" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => deleteRec(item)}
                                  className="text-foreground-muted hover:text-destructive p-1 hover:bg-destructive/10 rounded-lg transition-all"
                                >
                                  <FaTrash className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleRec(item._id)}
                        className={`mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                          item.completed
                            ? "bg-success/10 text-success"
                            : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        <FaCheck className="text-xs" />
                        {item.completed ? "Completed ✓" : "Mark as Done"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── MILESTONES ────────────────────────────────────────────────────── */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">📅 Milestones / Roadmap</h2>
            <button
              onClick={() => {
                setMsForm({ ...EMPTY_MS });
                setShowAddMs(true);
              }}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <FaPlus className="w-3 h-3" /> Add
            </button>
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              <p className="font-medium">No milestones yet</p>
              <p className="text-sm mt-1">
                Add milestones to track your journey
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div key={m._id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleMs(m._id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                        m.done
                          ? "bg-success text-white shadow-md"
                          : "bg-muted text-foreground-muted hover:bg-primary/20"
                      }`}
                    >
                      {m.done ? <FaCheck /> : i + 1}
                    </button>
                    {i < milestones.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 mt-2 ${m.done ? "bg-success" : "bg-border"}`}
                      />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4
                          className={`font-semibold text-sm ${m.done ? "text-success" : ""}`}
                        >
                          {m.title}
                        </h4>
                        {m.desc && (
                          <p className="text-sm text-foreground-muted mt-0.5">
                            {m.desc}
                          </p>
                        )}
                        {(m.startDate || m.endDate) && (
                          <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1">
                            <FaCalendar className="w-2.5 h-2.5" />
                            {fmtDate(m.startDate)} — {fmtDate(m.endDate)}
                          </p>
                        )}
                        {m.done && (
                          <p className="text-xs text-success mt-1 font-medium">
                            ✅ Completed!
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => openEditMs(m)}
                          className="text-foreground-muted hover:text-primary p-1 hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                        {m.done ? (
                          <span
                            title="Completed — cannot delete"
                            className="text-success p-1 cursor-not-allowed opacity-50"
                          >
                            <FaLock className="w-3 h-3" />
                          </span>
                        ) : (
                          <button
                            onClick={() => deleteMs(m)}
                            className="text-foreground-muted hover:text-destructive p-1 hover:bg-destructive/10 rounded-lg transition-all"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-foreground-muted mt-3">
            Click the circle number to mark a milestone done
          </p>
        </div>

        {/* ── Add Rec Modal ─────────────────────────────────────────────────── */}
        {showAddRec && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-6 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <FaPlus className="text-primary" /> Add Recommendation
                  </h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Fields marked <span className="text-destructive">*</span>{" "}
                    are required
                  </p>
                </div>
                <button onClick={() => setShowAddRec(false)}>
                  <FaTimes />
                </button>
              </div>
              <RecFormFields f={recForm} setF={setRecForm} />
              <button
                onClick={addRec}
                disabled={saving}
                className="btn-primary w-full mt-4 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Recommendation"}
              </button>
            </div>
          </div>
        )}

        {/* ── Edit Rec Modal ────────────────────────────────────────────────── */}
        {editRec && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-6 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FaEdit className="text-primary" /> Edit Recommendation
                </h2>
                <button onClick={() => setEditRec(null)}>
                  <FaTimes />
                </button>
              </div>
              <RecFormFields f={recForm} setF={setRecForm} />
              <button
                onClick={saveEditRec}
                disabled={saving}
                className="btn-primary w-full mt-4 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ── Add Milestone Modal ───────────────────────────────────────────── */}
        {showAddMs && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <FaPlus className="text-primary" /> Add Milestone
                  </h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Fields marked <span className="text-destructive">*</span>{" "}
                    are required
                  </p>
                </div>
                <button onClick={() => setShowAddMs(false)}>
                  <FaTimes />
                </button>
              </div>
              <MsFormFields f={msForm} setF={setMsForm} />
              <button
                onClick={addMs}
                disabled={saving}
                className="btn-primary w-full mt-4 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Milestone"}
              </button>
            </div>
          </div>
        )}

        {/* ── Edit Milestone Modal ──────────────────────────────────────────── */}
        {editMs && (
          <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md my-auto animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FaEdit className="text-primary" /> Edit Milestone
                </h2>
                <button onClick={() => setEditMs(null)}>
                  <FaTimes />
                </button>
              </div>
              <MsFormFields f={msForm} setF={setMsForm} />
              <button
                onClick={saveEditMs}
                disabled={saving}
                className="btn-primary w-full mt-4 disabled:opacity-50"
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
