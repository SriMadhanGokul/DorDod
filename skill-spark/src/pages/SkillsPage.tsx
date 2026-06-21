import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaSync,
  FaBook,
  FaTimes,
  FaChevronDown,
  FaCheck,
} from "react-icons/fa";

interface UserSkill {
  _id: string;
  name: string;
  status: "to-learn" | "learning" | "learned";
  category: string;
  addedToGoal?: boolean;
}

interface SkillPath {
  _id: string;
  user: string;
  careerPath: string;
  skills: UserSkill[];
  pathId: string;
}

interface SavedPath {
  _id: string;
  careerPath: string;
  careerId: string;
  skillCount: number;
  createdAt: string;
}

interface Career {
  id: string;
  title: string;
  emoji: string;
  color: string;
  totalSkills: number;
}

interface CustomSkill {
  _id: string;
  skillName: string;
  description: string;
  category: string;
  status: "to-learn" | "learning" | "learned";
  linkedGoal?: string;
  isCustom: true;
}

type DisplaySkill = (UserSkill | CustomSkill) & { isCustom?: boolean };

export default function SkillsPage() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [skillPath, setSkillPath] = useState<SkillPath | null>(null);
  const [allPaths, setAllPaths] = useState<SavedPath[]>([]);
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const [view, setView] = useState<"select" | "track">("select");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showPathSwitcher, setShowPathSwitcher] = useState(false);

  // Add Skill Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);

  // ✅ NEW FORM - Multiple skill names + mandatory fields
  const [customForm, setCustomForm] = useState({
    skillNames: [] as string[],
    skillNameInput: "", // Temporary input for adding skill names
    description: "",
    category: "Technical",
    status: "to-learn" as const,
  });

  // ✅ GOAL SELECTOR STATE (for auto-creating goal)
  const [linkingSkill, setLinkingSkill] = useState(false);

  // ✅ ADD TO GOAL - CREATE GOAL FROM SKILL (NO LINKING)
  const handleAddToGoal = async (skillId: string) => {
    try {
      // Find skill in CUSTOM skills first
      let skill: any = customSkills.find((s) => s._id === skillId);
      let skillName = skill?.skillName || "";
      let skillCategory = skill?.category || "";

      // If not found in custom skills, search in existing skills (skill path)
      if (!skillName && skillPath?.skills) {
        skill = skillPath.skills.find((s: any) => s._id === skillId);
        skillName = skill?.name || "";
        skillCategory = skill?.category || "";
      }

      if (!skillName) {
        toast.error("Skill name is required");
        return;
      }

      setLinkingSkill(true);

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

      // Create new goal with the skill name (NO LINKING)
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
      setLinkingSkill(false);
    }
  };

  // ✅ LOAD DATA ON MOUNT
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [careersRes, skillPathRes, customSkillsRes] = await Promise.all([
          api.get("/skill-path/careers"),
          api.get("/skill-path"),
          api.get("/custom-skills"),
        ]);

        setCareers(careersRes.data.data || []);
        const customSkillsData = (customSkillsRes.data.data || []).map(
          (skill: any) => ({
            _id: skill._id,
            skillName: skill.skillName,
            description: skill.description || "",
            category: skill.category || "Technical",
            status: skill.status || "to-learn",
            linkedGoal: skill.linkedGoal || null,
            isCustom: true,
          }),
        );
        setCustomSkills(customSkillsData);

        if (skillPathRes.data.data) {
          setSkillPath(skillPathRes.data.data);
          setAllPaths(skillPathRes.data.allPaths || []);
          setView("track");
        } else {
          setSkillPath(null);
          setAllPaths([]);
          setView("select");
        }
      } catch (error) {
        toast.error("Failed to load skills");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ CLOSE ADD SKILL MODAL
  const closeAddModal = () => {
    setShowAddModal(false);
    setCustomForm({
      skillNames: [],
      skillNameInput: "",
      description: "",
      category: "Technical",
      status: "to-learn",
    });
  };

  // ✅ ADD SKILL NAME TO LIST
  const handleAddSkillName = () => {
    const name = customForm.skillNameInput.trim();
    if (!name) {
      toast.error("Skill name cannot be empty");
      return;
    }

    if (customForm.skillNames.includes(name)) {
      toast.error("This skill name already added");
      return;
    }

    setCustomForm((prev) => ({
      ...prev,
      skillNames: [...prev.skillNames, name],
      skillNameInput: "",
    }));
  };

  // ✅ REMOVE SKILL NAME
  const handleRemoveSkillName = (index: number) => {
    setCustomForm((prev) => ({
      ...prev,
      skillNames: prev.skillNames.filter((_, i) => i !== index),
    }));
  };

  // ✅ HANDLE SKILL NAME INPUT KEY DOWN
  const handleSkillNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkillName();
    }
  };

  // ✅ SUBMIT MULTIPLE CUSTOM SKILLS
  const handleAddCustomSkill = async () => {
    // ✅ VALIDATE ALL MANDATORY FIELDS
    if (customForm.skillNames.length === 0) {
      toast.error("Add at least one skill name");
      return;
    }

    if (!customForm.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!customForm.category) {
      toast.error("Category is required");
      return;
    }

    setSavingCustom(true);
    try {
      const res = await api.post("/custom-skills", {
        skillNames: customForm.skillNames,
        description: customForm.description,
        category: customForm.category,
        status: customForm.status,
      });

      if (res.data.success) {
        const newSkills = res.data.data.map((skill: any) => ({
          _id: skill._id,
          skillName: skill.skillName,
          description: skill.description,
          category: skill.category,
          status: skill.status,
          linkedGoal: skill.linkedGoal || null,
          isCustom: true,
        }));
        setCustomSkills((prev) => [...newSkills, ...prev]);
        toast.success(`✅ ${newSkills.length} skill(s) added!`);
        closeAddModal();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to add custom skills",
      );
    } finally {
      setSavingCustom(false);
    }
  };

  // ✅ HANDLE UPDATE SKILL STATUS
  const handleUpdateSkillStatus = async (
    skillId: string,
    newStatus: string,
  ) => {
    if (!skillPath) return;

    try {
      const res = await api.patch(`/skill-path/skills/${skillId}`, {
        status: newStatus,
      });

      if (res.data.success) {
        setSkillPath(res.data.data);
        toast.success("Skill updated!");
      }
    } catch (error) {
      toast.error("Failed to update skill");
    }
  };

  // ✅ HANDLE UPDATE CUSTOM SKILL STATUS
  const handleUpdateCustomSkillStatus = async (
    skillId: string,
    newStatus: string,
  ) => {
    try {
      const res = await api.put(`/custom-skills/${skillId}`, {
        status: newStatus,
      });

      if (res.data.success) {
        setCustomSkills((prev) =>
          prev.map((s) =>
            s._id === skillId ? { ...s, status: newStatus as any } : s,
          ),
        );
        toast.success("Skill updated!");
      }
    } catch (error) {
      toast.error("Failed to update skill");
    }
  };

  // ✅ HANDLE ADD PATH
  const handleAddPath = async (careerId: string) => {
    try {
      setLoading(true);
      const res = await api.post("/skill-path/select", { careerId });

      if (res.data.success) {
        setSkillPath(res.data.data);
        setAllPaths(res.data.allPaths || []);
        setView("track");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to add path");
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE ACTIVATE PATH
  const handleActivatePath = async (pathId: string) => {
    try {
      const res = await api.patch(`/skill-path/${pathId}/activate`);

      if (res.data.success) {
        setSkillPath(res.data.data);
        setAllPaths(res.data.allPaths || []);
        setShowPathSwitcher(false);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to switch path");
    }
  };

  // ✅ HANDLE DELETE PATH
  const handleDeletePath = async (pathId: string) => {
    if (!window.confirm("Delete this career path? All progress will be lost."))
      return;

    try {
      const res = await api.delete(`/skill-path/paths/${pathId}`);

      if (res.data.success) {
        setAllPaths(res.data.allPaths || []);

        if (res.data.allPaths.length === 0) {
          setSkillPath(null);
          setView("select");
        } else {
          const skillPathRes = await api.get("/skill-path");
          if (skillPathRes.data.data) {
            setSkillPath(skillPathRes.data.data);
          }
        }

        setShowPathSwitcher(false);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to delete path");
    }
  };

  // ✅ NAVIGATE TO SKILL DETAILS PAGE
  const openSkillDetails = (skillId: string) => {
    navigate(`/skills/${skillId}`);
  };

  // ✅ GROUP ALL SKILLS (EXISTING + CUSTOM) BY CATEGORY
  const grouped = (() => {
    const allSkills: DisplaySkill[] = [];

    if (skillPath?.skills && Array.isArray(skillPath.skills)) {
      allSkills.push(...skillPath.skills);
    }

    allSkills.push(...customSkills);

    let filtered = allSkills;

    if (filterStatus !== "all") {
      filtered = filtered.filter((s) => s?.status === filterStatus);
    }

    if (search) {
      filtered = filtered.filter(
        (s) =>
          (s as any)?.name?.toLowerCase?.()?.includes(search.toLowerCase()) ||
          (s as any)?.skillName
            ?.toLowerCase?.()
            ?.includes(search.toLowerCase()),
      );
    }

    return filtered.reduce(
      (acc, skill) => {
        const category = (skill as any)?.category || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      },
      {} as Record<string, DisplaySkill[]>,
    );
  })();

  // ✅ GET SKILL NAME
  const getSkillName = (skill: DisplaySkill) => {
    return (skill as any).name || (skill as any).skillName;
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <FaSync className="text-4xl text-blue-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading skills...</p>
        </div>
      </div>
    );
  }

  // ✅ CAREER SELECTION VIEW
  const selectViewContent = (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your Career Path
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select a career to see the skills you need to master
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {careers.length > 0 ? (
          careers.map((career) => (
            <button
              key={career.id}
              onClick={() => handleAddPath(career.id)}
              className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left bg-white dark:bg-gray-900"
            >
              <div className="text-4xl mb-3">{career.emoji}</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {career.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {career.totalSkills} skills to master
              </p>
            </button>
          ))
        ) : (
          <p className="col-span-full text-gray-600 dark:text-gray-400">
            No careers available
          </p>
        )}
      </div>

      {customSkills.length > 0 && (
        <div className="mt-10 pt-10 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📚 My Skills
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Skills you're tracking
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FaPlus className="text-xs" /> Add Skill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customSkills.map((skill) => (
              <button
                key={`custom-select-${skill._id}`}
                onClick={() => openSkillDetails(skill._id)}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {skill.skillName}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {skill.status === "to-learn" && "Not started"}
                  {skill.status === "learning" && "In progress"}
                  {skill.status === "learned" && "✅ Completed"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {skill.category}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {customSkills.length === 0 && (
        <div className="text-center py-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FaPlus /> Add Your First Skill
          </button>
        </div>
      )}
    </div>
  );

  // ✅ SKILLS TRACKING VIEW
  const trackViewContent = (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {skillPath?.careerPath || "Skills"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Master {(skillPath?.skills?.length || 0) + customSkills.length}{" "}
            skills
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FaPlus className="text-xs" /> Add Skill
          </button>

          <button
            onClick={() => setView("select")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FaSync className="text-xs" /> Change Path
          </button>

          {allPaths.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowPathSwitcher(!showPathSwitcher)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <FaSync className="text-xs" /> Switch ({allPaths.length})
                <FaChevronDown className="text-xs" />
              </button>

              {showPathSwitcher && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-50">
                  <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                    {allPaths.map((path) => (
                      <div
                        key={`path-${path._id}`}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          skillPath?.pathId === path._id
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div
                          onClick={() => handleActivatePath(path._id)}
                          className="flex items-start justify-between mb-2"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {path.careerPath}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {path.skillCount} skills
                            </p>
                          </div>
                          {skillPath?.pathId === path._id && (
                            <FaCheck className="text-blue-600 dark:text-blue-400 text-sm mt-1" />
                          )}
                        </div>

                        {skillPath?.pathId !== path._id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePath(path._id);
                            }}
                            className="w-full text-xs py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {["all", "to-learn", "learning", "learned"].map((status) => (
            <button
              key={`filter-${status}`}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {status === "all"
                ? "All"
                : status === "to-learn"
                  ? "To Learn"
                  : status === "learning"
                    ? "Learning"
                    : "Learned"}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* UNIFIED SKILLS GRID */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, skills]) => (
            <div key={`category-${category}`}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skills.map((skill) => {
                  const isCustom = (skill as CustomSkill).isCustom;
                  const skillName = getSkillName(skill);

                  return (
                    <div
                      key={`skill-${skill._id}`}
                      className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openSkillDetails(skill._id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {skillName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {skill.status === "to-learn" && "Not started"}
                            {skill.status === "learning" && "In progress"}
                            {skill.status === "learned" && "✅ Completed"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {skill.status !== "learned" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                isCustom
                                  ? handleUpdateCustomSkillStatus(
                                      skill._id,
                                      "learning",
                                    )
                                  : handleUpdateSkillStatus(
                                      skill._id,
                                      "learning",
                                    );
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-semibold"
                            >
                              Learning
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                isCustom
                                  ? handleUpdateCustomSkillStatus(
                                      skill._id,
                                      "learned",
                                    )
                                  : handleUpdateSkillStatus(
                                      skill._id,
                                      "learned",
                                    );
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-semibold"
                            >
                              Learned
                            </button>
                          </>
                        )}
                        {skill.status === "learned" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              isCustom
                                ? handleUpdateCustomSkillStatus(
                                    skill._id,
                                    "learning",
                                  )
                                : handleUpdateSkillStatus(
                                    skill._id,
                                    "learning",
                                  );
                            }}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold"
                          >
                            Mark Learning
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToGoal(skill._id);
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 transition-colors font-semibold"
                        >
                          + Add to Goal
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSkillDetails(skill._id);
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <FaBook className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {search || filterStatus !== "all"
              ? "No skills match your filters"
              : "No skills yet. Click 'Add Skill' to get started!"}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {view === "select" ? selectViewContent : trackViewContent}

      {/* ADD SKILL MODAL - Multiple skill names */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Add New Skills
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Add one or more skills to track
                </p>
              </div>
              <button
                onClick={closeAddModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* SKILL NAMES INPUT */}
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Skill Names <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g. React, Next.js, Tailwind"
                    value={customForm.skillNameInput}
                    onChange={(e) =>
                      setCustomForm({
                        ...customForm,
                        skillNameInput: e.target.value,
                      })
                    }
                    onKeyDown={handleSkillNameKeyDown}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Press Enter to add each skill
                  </p>

                  {/* Display added skills */}
                  {customForm.skillNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {customForm.skillNames.map((name, idx) => (
                        <div
                          key={`skill-${idx}-${name}`}
                          className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium"
                        >
                          <span>{name}</span>
                          <button
                            onClick={() => handleRemoveSkillName(idx)}
                            className="hover:text-blue-900 dark:hover:text-blue-200 transition-colors font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* DESCRIPTION - MANDATORY */}
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe these skills (applies to all)..."
                  value={customForm.description}
                  onChange={(e) =>
                    setCustomForm({
                      ...customForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                />
              </div>

              {/* CATEGORY & STATUS - BOTH MANDATORY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={customForm.category}
                    onChange={(e) =>
                      setCustomForm({
                        ...customForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Creative">Creative</option>
                    <option value="Language">Language</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Starting Status
                  </label>
                  <select
                    value={customForm.status}
                    onChange={(e) =>
                      setCustomForm({
                        ...customForm,
                        status: e.target.value as
                          | "to-learn"
                          | "learning"
                          | "learned",
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="to-learn">To Learn</option>
                    <option value="learning">Learning</option>
                    <option value="learned">Learned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 pt-0 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={closeAddModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomSkill}
                disabled={savingCustom}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingCustom ? "Adding..." : "Add Skills"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
