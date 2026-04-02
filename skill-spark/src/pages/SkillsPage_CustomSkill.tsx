// This is a PARTIAL addition — the custom skill section to add to your existing SkillsPage
// Add this inside the track view, after the skill categories section

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaTrash, FaEdit } from "react-icons/fa";

interface CustomSkill {
  _id: string;
  skillName: string;
  alreadyKnows: string;
  wantsToLearn: string;
  description: string;
  category: string;
  status: "current" | "completed" | "planned";
}

// Custom skills hook — use inside SkillsPage
export function useCustomSkills() {
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);

  useEffect(() => {
    api
      .get("/custom-skills")
      .then((r) => setCustomSkills(r.data.data))
      .catch(() => {});
  }, []);

  const addCustomSkill = async (form: Omit<CustomSkill, "_id">) => {
    const res = await api.post("/custom-skills", form);
    setCustomSkills((p) => [res.data.data, ...p]);
    return res.data.data;
  };

  const deleteCustomSkill = async (id: string) => {
    await api.delete(`/custom-skills/${id}`);
    setCustomSkills((p) => p.filter((s) => s._id !== id));
  };

  return { customSkills, addCustomSkill, deleteCustomSkill };
}

// CustomSkillsSection — drop this inside SkillsPage track view
export function CustomSkillsSection() {
  const { customSkills, addCustomSkill, deleteCustomSkill } = useCustomSkills();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    skillName: "",
    alreadyKnows: "",
    wantsToLearn: "",
    description: "",
    category: "Other",
    status: "current" as const,
  });

  const handleAdd = async () => {
    if (!form.skillName.trim()) return toast.error("Skill name is required");
    setSaving(true);
    try {
      await addCustomSkill(form);
      toast.success("Custom skill added!");
      setShowModal(false);
      setForm({
        skillName: "",
        alreadyKnows: "",
        wantsToLearn: "",
        description: "",
        category: "Other",
        status: "current",
      });
    } catch {
      toast.error("Failed to add skill");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s: string) =>
    s === "completed"
      ? "bg-success/20 text-success border-success/40"
      : s === "current"
        ? "bg-primary/20 text-primary border-primary/40"
        : "bg-muted text-foreground-muted border-border";

  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">➕ My Custom Skills</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Add skills not in your career path
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm flex items-center gap-2 py-2"
        >
          <FaPlus className="w-3 h-3" /> Add Other Skill
        </button>
      </div>

      {customSkills.length === 0 ? (
        <p className="text-sm text-foreground-muted text-center py-6">
          No custom skills yet. Click "Add Other Skill" to add skills outside
          your career path.
        </p>
      ) : (
        <div className="space-y-3">
          {customSkills.map((s) => (
            <div
              key={s._id}
              className={`p-4 rounded-xl border transition-all ${statusColor(s.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{s.skillName}</h3>
                    <span className="text-xs capitalize opacity-70">
                      {s.status}
                    </span>
                    <span className="text-xs bg-card px-2 py-0.5 rounded-full">
                      {s.category}
                    </span>
                  </div>
                  {s.description && (
                    <p className="text-xs opacity-80 mb-2">{s.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {s.alreadyKnows && (
                      <div>
                        <p className="text-xs font-medium opacity-70">
                          Already know:
                        </p>
                        <p className="text-xs opacity-60">{s.alreadyKnows}</p>
                      </div>
                    )}
                    {s.wantsToLearn && (
                      <div>
                        <p className="text-xs font-medium opacity-70">
                          Want to learn:
                        </p>
                        <p className="text-xs opacity-60">{s.wantsToLearn}</p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteCustomSkill(s._id)}
                  className="text-foreground-muted hover:text-destructive ml-2 p-1"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold">Add Custom Skill</h2>
                <p className="text-xs text-foreground-muted">
                  Track a skill outside your career path
                </p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Skill name *"
                value={form.skillName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, skillName: e.target.value }))
                }
                className="input-field"
              />
              <textarea
                placeholder="What you already know about this skill"
                value={form.alreadyKnows}
                onChange={(e) =>
                  setForm((p) => ({ ...p, alreadyKnows: e.target.value }))
                }
                className="input-field min-h-[60px]"
              />
              <textarea
                placeholder="What you want to learn"
                value={form.wantsToLearn}
                onChange={(e) =>
                  setForm((p) => ({ ...p, wantsToLearn: e.target.value }))
                }
                className="input-field min-h-[60px]"
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
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="input-field"
                  >
                    {[
                      "Technical",
                      "Leadership",
                      "Soft Skills",
                      "Creative",
                      "Language",
                      "Other",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value as any }))
                    }
                    className="input-field"
                  >
                    <option value="planned">Planned</option>
                    <option value="current">Currently Learning</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Custom Skill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
