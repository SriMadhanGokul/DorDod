import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaTrash, FaPaperPlane } from "react-icons/fa";

interface Activity {
  _id: string;
  title: string;
  description: string;
  status: "Not Started" | "In Progress" | "On Hold" | "Completed";
  dueDate?: string;
  linkedGoal?: { title: string };
  updates: { _id: string; text: string; createdAt: string }[];
}

const STATUSES = [
  "Not Started",
  "In Progress",
  "On Hold",
  "Completed",
] as const; 
const STATUS_COLORS: Record<string, string> = {
  "Not Started": "bg-muted text-foreground-muted",
  "In Progress": "bg-primary-light text-primary",
  "On Hold": "bg-secondary/20 text-secondary-foreground",
  Completed: "bg-success/20 text-success",
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState("");
  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/activities")
      .then((r) => setActivities(r.data.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const res = await api.post("/activities", form);
      setActivities((p) => [res.data.data, ...p]);
      setForm({ title: "", description: "", dueDate: "" });
      setShowModal(false);
      toast.success("Activity created!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await api.put(`/activities/${id}`, { status });
      setActivities((p) => p.map((a) => (a._id === id ? res.data.data : a)));
    } catch {
      toast.error("Failed to update");
    }
  };

  const addUpdate = async (id: string) => {
    if (!updateText.trim()) return;
    try {
      const res = await api.post(`/activities/${id}/updates`, {
        text: updateText,
      });
      setActivities((p) => p.map((a) => (a._id === id ? res.data.data : a)));
      setUpdateText("");
      toast.success("Update added!");
    } catch {
      toast.error("Failed");
    }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/activities/${id}`);
      setActivities((p) => p.filter((a) => a._id !== id));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed");
    }
  };

  // Board columns
  const byStatus = (s: string) => activities.filter((a) => a.status === s);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Activities</h1>
            <p className="text-foreground-muted mt-1">
              Track your tasks and actions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setViewMode(viewMode === "board" ? "list" : "board")
              }
              className="btn-secondary text-sm py-2 px-3"
            >
              {viewMode === "board" ? "List View" : "Board View"}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FaPlus /> New Activity
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Board View */}
        {!loading && viewMode === "board" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map((status) => (
              <div key={status} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{status}</h3>
                  <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                    {byStatus(status).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {byStatus(status).map((a) => (
                    <div  
                      key={a._id}
                      className="bg-card rounded-lg p-3 shadow-sm cursor-pointer"
                      onClick={() =>
                        setExpanded(expanded === a._id ? null : a._id)
                      }
                    >
                      <p className="text-xs font-medium mb-1">{a.title}</p>
                      {a.dueDate && (
                        <p className="text-xs text-foreground-muted">
                          Due: {new Date(a.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {STATUSES.filter((s) => s !== status).map((s) => (
                          <button
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(a._id, s);
                            }}
                            className="text-xs bg-muted hover:bg-primary hover:text-primary-foreground px-1.5 py-0.5 rounded transition-all"
                          >
                            → {s.split(" ")[0]}
                          </button>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            del(a._id);
                          }}
                          className="text-xs text-destructive hover:underline ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                      {expanded === a._id && (
                        <div className="mt-2 pt-2 border-t border-border">
                          {a.updates.map((u) => (
                            <p
                              key={u._id}
                              className="text-xs text-foreground-muted mb-1"
                            >
                              • {u.text}
                            </p>
                          ))}
                          <div className="flex gap-1 mt-2">
                            <input
                              value={updateText}
                              onChange={(e) => setUpdateText(e.target.value)}
                              placeholder="Add update..."
                              className="input-field flex-1 text-xs py-1"
                            />
                            <button
                              onClick={() => addUpdate(a._id)}
                              className="text-primary"
                            >
                              <FaPaperPlane className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === "list" && (
          <div className="space-y-3">
            {activities.length === 0 && (
              <div className="text-center py-16 text-foreground-muted">
                <p className="font-medium">No activities yet</p>
              </div>
            )}
            {activities.map((a) => (
              <div key={a._id} className="card-elevated">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status]}`}
                      >
                        {a.status}
                      </span>
                    </div>
                    {a.description && (
                      <p className="text-sm text-foreground-muted">
                        {a.description}
                      </p>
                    )}
                    {a.dueDate && (
                      <p className="text-xs text-foreground-muted mt-1">
                        Due: {new Date(a.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a._id, e.target.value)}
                      className="input-field text-xs py-1 w-36"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => del(a._id)}
                      className="text-foreground-muted hover:text-destructive"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  {a.updates.map((u) => (
                    <p
                      key={u._id}
                      className="text-xs text-foreground-muted mb-1"
                    >
                      • {u.text}
                    </p>
                  ))}
                  <div
                    className="flex gap-2 mt-2"
                    onClick={() => setExpanded(a._id)}
                  >
                    <input
                      value={expanded === a._id ? updateText : ""}
                      onChange={(e) => setUpdateText(e.target.value)}
                      onFocus={() => setExpanded(a._id)}
                      placeholder="Add update..."
                      className="input-field flex-1 text-sm py-1.5"
                    />
                    <button
                      onClick={() => addUpdate(a._id)}
                      className="btn-primary py-1.5 px-3 text-sm"
                    >
                      <FaPaperPlane className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">New Activity</h2>
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
                />
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="input-field min-h-[70px]"
                />
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
      </div>
    </DashboardLayout>
  );
}
