import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";

interface CustomSkill {
  _id: string;
  skillName: string;
  alreadyKnows: string[];
  wantsToLearn: string[];
  description: string;
  category: string;
  status: "to-learn" | "learning" | "learned";
  isCustom: true;
}

interface UserSkill {
  _id: string;
  name: string;
  status: "to-learn" | "learning" | "learned";
  category: string;
  addedToGoal?: boolean;
  isCustom?: false;
}

type DisplaySkill = UserSkill | CustomSkill;

export default function SkillDetailsPage() {
  const navigate = useNavigate();
  const { skillId } = useParams<{ skillId: string }>();
  const [skill, setSkill] = useState<DisplaySkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    alreadyKnows: [] as string[],
    wantsToLearn: [] as string[],
    description: "",
  });
  const [tagInputs, setTagInputs] = useState({
    alreadyKnows: "",
    wantsToLearn: "",
  });
  const [saving, setSaving] = useState(false);

  // ✅ LOAD SKILL DATA
  useEffect(() => {
    const loadSkill = async () => {
      try {
        setLoading(true);

        // Try to load as custom skill first
        try {
          const customRes = await api.get(`/custom-skills/${skillId}`);
          if (customRes.data.data) {
            const skill = customRes.data.data;
            setSkill({
              ...skill,
              isCustom: true,
              // Normalize wantsToLearn
              wantsToLearn: Array.isArray(skill.wantsToLearn)
                ? skill.wantsToLearn.map((item: any) =>
                    typeof item === "string" ? item : item.name,
                  )
                : [],
            });
            setEditForm({
              alreadyKnows: skill.alreadyKnows || [],
              wantsToLearn: Array.isArray(skill.wantsToLearn)
                ? skill.wantsToLearn.map((item: any) =>
                    typeof item === "string" ? item : item.name,
                  )
                : [],
              description: skill.description || "",
            });
            return;
          }
        } catch (error) {
          // Not a custom skill, try as existing skill
        }

        // Load as existing skill
        const skillPathRes = await api.get("/skill-path");
        if (skillPathRes.data.data?.skills) {
          const existingSkill = skillPathRes.data.data.skills.find(
            (s: any) => s._id === skillId,
          );
          if (existingSkill) {
            setSkill(existingSkill);
            return;
          }
        }

        toast.error("Skill not found");
        navigate("/skills");
      } catch (error) {
        toast.error("Failed to load skill");
        navigate("/skills");
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      loadSkill();
    }
  }, [skillId, navigate]);

  // ✅ ADD TAG
  const handleAddTag = (field: "alreadyKnows" | "wantsToLearn") => {
    const value = tagInputs[field].trim();
    if (!value) return;

    if (editForm[field].includes(value)) {
      toast.error("This item already exists");
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [field]: [...prev[field], value],
    }));

    setTagInputs((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  // ✅ REMOVE TAG
  const handleRemoveTag = (
    field: "alreadyKnows" | "wantsToLearn",
    index: number,
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // ✅ HANDLE TAG INPUT KEY DOWN
  const handleTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "alreadyKnows" | "wantsToLearn",
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(field);
    }
  };

  // ✅ UPDATE SKILL STATUS
  const handleUpdateStatus = async (newStatus: string) => {
    if (!skill) return;

    try {
      setSaving(true);
      if ((skill as CustomSkill).isCustom) {
        const res = await api.put(`/custom-skills/${skill._id}`, {
          status: newStatus,
        });
        if (res.data.success) {
          const updated = {
            ...res.data.data,
            isCustom: true,
            wantsToLearn: Array.isArray(res.data.data.wantsToLearn)
              ? res.data.data.wantsToLearn.map((item: any) =>
                  typeof item === "string" ? item : item.name,
                )
              : [],
          };
          setSkill(updated);
          toast.success("Status updated!");
        }
      } else {
        const res = await api.patch(`/skill-path/skills/${skill._id}`, {
          status: newStatus,
        });
        if (res.data.success) {
          const updated = res.data.data.skills.find(
            (s: any) => s._id === skill._id,
          );
          if (updated) {
            setSkill(updated);
            toast.success("Status updated!");
          }
        }
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  // ✅ SAVE CUSTOM SKILL EDITS
  const handleSaveEdits = async () => {
    if (!skill || !(skill as CustomSkill).isCustom) return;

    try {
      setSaving(true);
      const res = await api.put(`/custom-skills/${skill._id}`, {
        alreadyKnows: editForm.alreadyKnows,
        wantsToLearn: editForm.wantsToLearn,
        description: editForm.description,
      });

      if (res.data.success) {
        const updated = {
          ...res.data.data,
          isCustom: true,
          wantsToLearn: Array.isArray(res.data.data.wantsToLearn)
            ? res.data.data.wantsToLearn.map((item: any) =>
                typeof item === "string" ? item : item.name,
              )
            : [],
        };
        setSkill(updated);
        setIsEditing(false);
        toast.success("Skill updated!");
      }
    } catch (error) {
      toast.error("Failed to save edits");
    } finally {
      setSaving(false);
    }
  };

  // ✅ DELETE SKILL
  const handleDeleteSkill = async () => {
    if (!skill || !window.confirm("Delete this skill?")) return;

    try {
      setSaving(true);
      if ((skill as CustomSkill).isCustom) {
        await api.delete(`/custom-skills/${skill._id}`);
      }
      toast.success("Skill deleted!");
      navigate("/skills");
    } catch (error) {
      toast.error("Failed to delete skill");
    } finally {
      setSaving(false);
    }
  };

  // ✅ ADD TO GOAL
  const handleAddGoal = async () => {
    if (!skill) return;

    try {
      if ((skill as CustomSkill).isCustom) {
        toast.info("Create a new goal and add this skill to track it");
        navigate("/goals");
      } else {
        const res = await api.post(`/skill-path/skills/${skill._id}/add-goal`);
        if (res.data.success) {
          toast.success(res.data.message);
          navigate("/goals");
        }
      }
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Loading skill...</p>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Skill not found</p>
      </div>
    );
  }

  const isCustom = (skill as CustomSkill).isCustom;
  const skillName = (skill as any).skillName || (skill as any).name;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* HEADER */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/skills")}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-4"
        >
          <FaArrowLeft /> Back to Skills
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {skillName}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                {(skill as any).category}
              </span>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  skill.status === "to-learn"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    : skill.status === "learning"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                }`}
              >
                {skill.status === "to-learn"
                  ? "To Learn"
                  : skill.status === "learning"
                    ? "Learning"
                    : "Learned"}
              </span>
            </div>
          </div>

          {isCustom && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <FaEdit /> {isEditing ? "Cancel" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-6">
        {/* DESCRIPTION */}
        {isCustom && (skill as CustomSkill).description && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Description
            </h2>
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {(skill as CustomSkill).description}
              </p>
            )}
          </div>
        )}

        {/* ALREADY KNOWS */}
        {isCustom && (skill as CustomSkill).alreadyKnows.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-bold text-green-900 dark:text-green-200 mb-4">
              ✓ Already Know
            </h2>

            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Add new item and press Enter..."
                  value={tagInputs.alreadyKnows}
                  onChange={(e) =>
                    setTagInputs({
                      ...tagInputs,
                      alreadyKnows: e.target.value,
                    })
                  }
                  onKeyDown={(e) => handleTagInputKeyDown(e, "alreadyKnows")}
                  className="w-full px-4 py-2 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {editForm.alreadyKnows.map((item, idx) => (
                    <div
                      key={`edit-know-${idx}`}
                      className="flex items-center gap-1.5 bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {item}
                      <button
                        onClick={() => handleRemoveTag("alreadyKnows", idx)}
                        className="hover:text-green-900 dark:hover:text-green-100 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(skill as CustomSkill).alreadyKnows.map((item, idx) => (
                  <span
                    key={`know-${idx}`}
                    className="bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WANTS TO LEARN */}
        {isCustom && (skill as CustomSkill).wantsToLearn.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4">
              → Want to Learn
            </h2>

            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Add new item and press Enter..."
                  value={tagInputs.wantsToLearn}
                  onChange={(e) =>
                    setTagInputs({
                      ...tagInputs,
                      wantsToLearn: e.target.value,
                    })
                  }
                  onKeyDown={(e) => handleTagInputKeyDown(e, "wantsToLearn")}
                  className="w-full px-4 py-2 border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {editForm.wantsToLearn.map((item, idx) => (
                    <div
                      key={`edit-learn-${idx}`}
                      className="flex items-center gap-1.5 bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {item}
                      <button
                        onClick={() => handleRemoveTag("wantsToLearn", idx)}
                        className="hover:text-blue-900 dark:hover:text-blue-100 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(skill as CustomSkill).wantsToLearn.map((item, idx) => (
                  <span
                    key={`learn-${idx}`}
                    className="bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
          {/* Status Actions */}
          {skill.status !== "learned" && (
            <button
              onClick={() => handleUpdateStatus("learning")}
              disabled={saving}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              Mark Learning
            </button>
          )}

          {skill.status !== "learned" && (
            <button
              onClick={() => handleUpdateStatus("learned")}
              disabled={saving}
              className="px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              Mark Learned
            </button>
          )}

          {skill.status === "learned" && (
            <button
              onClick={() => handleUpdateStatus("learning")}
              disabled={saving}
              className="px-4 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              Mark Learning
            </button>
          )}

          {/* Add Goal Button */}
          <button
            onClick={handleAddGoal}
            disabled={saving}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            + Add Goal
          </button>

          {/* Save/Delete Actions */}
          {isEditing && isCustom && (
            <button
              onClick={handleSaveEdits}
              disabled={saving}
              className="px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 col-span-2"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}

          {isCustom && !isEditing && (
            <button
              onClick={handleDeleteSkill}
              disabled={saving}
              className="px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FaTrash /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
