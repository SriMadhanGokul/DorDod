import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaTrash, FaLink, FaTimes } from "react-icons/fa";

interface CustomSkill {
  _id: string;
  skillName: string;
  description: string;
  category: string;
  status: "to-learn" | "learning" | "learned";
  linkedGoal?: string;
  isCustom: true;
}

interface UserSkill {
  _id: string;
  name: string;
  status: "to-learn" | "learning" | "learned";
  category: string;
  isCustom?: false;
}

interface Goal {
  _id: string;
  title: string;
  status: string;
  category?: string;
}

type DisplaySkill = UserSkill | CustomSkill;

export default function SkillDetailsPage() {
  const navigate = useNavigate();
  const { skillId } = useParams<{ skillId: string }>();
  const [skill, setSkill] = useState<DisplaySkill | null>(null);
  const [loading, setLoading] = useState(true);
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
            setSkill({
              ...customRes.data.data,
              isCustom: true,
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
          setSkill({
            ...res.data.data,
            isCustom: true,
          });
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

  // ✅ DELETE SKILL (custom only)
  const handleDeleteSkill = async () => {
    if (!skill || !window.confirm("Delete this skill?")) return;

    try {
      setSaving(true);
      if ((skill as CustomSkill).isCustom) {
        await api.delete(`/custom-skills/${skill._id}`);
        toast.success("Skill deleted!");
        navigate("/skills");
      }
    } catch (error) {
      toast.error("Failed to delete skill");
    } finally {
      setSaving(false);
    }
  };

  // ✅ ADD TO GOAL - CREATE GOAL FROM SKILL (NO LINKING)
  const handleAddToGoal = async () => {
    if (!skill) return;

    try {
      setSaving(true);

      // Get skill name - works for both custom and existing skills
      let skillName = (skill as any).skillName || (skill as any).name || "";
      let skillCategory = (skill as any).category || "";

      if (!skillName) {
        toast.error("Skill name is required");
        return;
      }

      // Map skill category to valid goal category
      let goalCategory = "Learning"; // Default
      if (skillCategory.toLowerCase().includes("leadership"))
        goalCategory = "Career";
      else if (skillCategory.toLowerCase().includes("health"))
        goalCategory = "Health";
      else if (skillCategory.toLowerCase().includes("finance"))
        goalCategory = "Finance";
      else if (skillCategory.toLowerCase().includes("personal"))
        goalCategory = "Personal";

      // Create new goal with skill name (NO LINKING)
      const goalRes = await api.post("/goals", {
        title: skillName,
        description: `Goal to master ${skillName}`,
        category: goalCategory,
        priority: "Medium",
        duration: 30,
      });

      if (goalRes.data.success) {
        toast.success(`✅ New goal "${skillName}" created!`);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create goal from skill",
      );
    } finally {
      setSaving(false);
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
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-6">
        {/* DESCRIPTION */}
        {(skill as CustomSkill).description && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {(skill as CustomSkill).description}
            </p>
          </div>
        )}

        {/* ADD TO GOAL SECTION (custom only) */}
        {isCustom && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-4">
              <FaLink className="inline mr-2" /> Create Goal from Skill
            </h2>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              Create a new goal with the same name as this skill
            </p>
            <button
              onClick={handleAddToGoal}
              disabled={saving}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              + Add to Goal
            </button>
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

          {/* Delete Button (custom only) */}
          {isCustom && (
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
