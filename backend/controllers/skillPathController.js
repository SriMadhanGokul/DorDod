const SkillPath = require("../models/SkillPath");
const Goal = require("../models/Goal");
const careerPaths = require("../data/careerPaths");
const { getSkillResources } = require("../data/skillResources");
const mongoose = require("mongoose");

// GET /api/skill-path/careers
const getCareers = (req, res) => {
  const simplified = careerPaths.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    emoji: p.emoji,
    demand: p.demand,
    color: p.color,
    totalSkills: p.categories.reduce((sum, c) => sum + c.skills.length, 0),
  }));
  res.status(200).json({ success: true, data: simplified });
};

// GET /api/skill-path
// ✅ Returns all paths and active path
const getSkillPath = async (req, res) => {
  try {
    const skillPath = await SkillPath.findOne({ user: req.user.id });

    if (!skillPath) {
      return res.status(200).json({ success: true, data: null });
    }

    // ✅ Find active path or default to first
    let activePathData = null;
    if (skillPath.activePath) {
      activePathData = skillPath.paths.find(
        (p) => p._id.toString() === skillPath.activePath.toString(),
      );
    }

    // Fallback: use first path if no active path set
    if (!activePathData && skillPath.paths.length > 0) {
      activePathData = skillPath.paths[0];
      skillPath.activePath = activePathData._id;
      await skillPath.save();
    }

    // Return active path in the old format for compatibility
    res.status(200).json({
      success: true,
      data: activePathData
        ? {
            _id: skillPath._id,
            user: skillPath.user,
            careerPath: activePathData.careerPath,
            skills: activePathData.skills,
            pathId: activePathData._id, // New: ID of this specific path
          }
        : null,
      allPaths: skillPath.paths.map((p) => ({
        _id: p._id,
        careerPath: p.careerPath,
        careerId: p.careerId,
        skillCount: p.skills.length,
        createdAt: p.createdAt,
      })),
      activePath: skillPath.activePath,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch skill path" });
  }
};

// POST /api/skill-path/select
// ✅ UPDATED: Adds new path instead of replacing
const selectCareerPath = async (req, res) => {
  try {
    const { careerId } = req.body;
    const career = careerPaths.find((p) => p.id === careerId);
    if (!career)
      return res
        .status(404)
        .json({ success: false, message: "Career path not found" });

    // ✅ Build skills array from career data
    const skills = [];
    career.categories.forEach((cat) => {
      cat.skills.forEach((skillName) => {
        skills.push({
          name: skillName,
          status: "to-learn",
          category: cat.name,
          addedToGoal: false,
        });
      });
    });

    // ✅ Create new path entry
    const newPathId = new mongoose.Types.ObjectId();
    const newPathEntry = {
      _id: newPathId,
      careerPath: career.title,
      careerId: careerId,
      skills: skills,
      createdAt: new Date(),
    };

    // ✅ Find or create SkillPath document
    let skillPath = await SkillPath.findOne({ user: req.user.id });

    if (!skillPath) {
      // Create new document with first path
      skillPath = await SkillPath.create({
        user: req.user.id,
        paths: [newPathEntry],
        activePath: newPathId,
      });
    } else {
      // ✅ Check if path already exists
      const existingPath = skillPath.paths.find((p) => p.careerId === careerId);

      if (existingPath) {
        // Path already exists, just activate it
        skillPath.activePath = existingPath._id;
        await skillPath.save();
        return res.status(200).json({
          success: true,
          message: `${career.emoji} ${career.title} activated!`,
          data: {
            _id: skillPath._id,
            user: skillPath.user,
            careerPath: existingPath.careerPath,
            skills: existingPath.skills,
            pathId: existingPath._id,
          },
          allPaths: skillPath.paths.map((p) => ({
            _id: p._id,
            careerPath: p.careerPath,
            careerId: p.careerId,
            skillCount: p.skills.length,
            createdAt: p.createdAt,
          })),
          activePath: skillPath.activePath,
        });
      }

      // ✅ Add new path to existing document
      skillPath.paths.push(newPathEntry);
      skillPath.activePath = newPathId;
      await skillPath.save();
    }

    res.status(201).json({
      success: true,
      message: `${career.emoji} ${career.title} added!`,
      data: {
        _id: skillPath._id,
        user: skillPath.user,
        careerPath: newPathEntry.careerPath,
        skills: newPathEntry.skills,
        pathId: newPathEntry._id,
      },
      allPaths: skillPath.paths.map((p) => ({
        _id: p._id,
        careerPath: p.careerPath,
        careerId: p.careerId,
        skillCount: p.skills.length,
        createdAt: p.createdAt,
      })),
      activePath: skillPath.activePath,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to select career path" });
  }
};

// ✅ NEW: Switch between existing paths
// PATCH /api/skill-path/activate/:pathId
const activatePath = async (req, res) => {
  try {
    const { pathId } = req.params;

    const skillPath = await SkillPath.findOne({ user: req.user.id });
    if (!skillPath)
      return res
        .status(404)
        .json({ success: false, message: "Skill path not found" });

    const path = skillPath.paths.find((p) => p._id.toString() === pathId);
    if (!path)
      return res
        .status(404)
        .json({ success: false, message: "Path not found" });

    skillPath.activePath = path._id;
    await skillPath.save();

    res.status(200).json({
      success: true,
      message: `Switched to ${path.careerPath}!`,
      data: {
        _id: skillPath._id,
        user: skillPath.user,
        careerPath: path.careerPath,
        skills: path.skills,
        pathId: path._id,
      },
      allPaths: skillPath.paths.map((p) => ({
        _id: p._id,
        careerPath: p.careerPath,
        careerId: p.careerId,
        skillCount: p.skills.length,
        createdAt: p.createdAt,
      })),
      activePath: skillPath.activePath,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to activate path" });
  }
};

// ✅ NEW: Delete a path
// DELETE /api/skill-path/paths/:pathId
const deletePath = async (req, res) => {
  try {
    const { pathId } = req.params;

    const skillPath = await SkillPath.findOne({ user: req.user.id });
    if (!skillPath)
      return res
        .status(404)
        .json({ success: false, message: "Skill path not found" });

    const pathIndex = skillPath.paths.findIndex(
      (p) => p._id.toString() === pathId,
    );
    if (pathIndex === -1)
      return res
        .status(404)
        .json({ success: false, message: "Path not found" });

    const deletedPath = skillPath.paths[pathIndex];
    skillPath.paths.splice(pathIndex, 1);

    // ✅ If deleted path was active, switch to first remaining path
    if (skillPath.activePath.toString() === pathId) {
      if (skillPath.paths.length > 0) {
        skillPath.activePath = skillPath.paths[0]._id;
      } else {
        skillPath.activePath = null;
      }
    }

    await skillPath.save();

    res.status(200).json({
      success: true,
      message: `${deletedPath.careerPath} deleted!`,
      allPaths: skillPath.paths.map((p) => ({
        _id: p._id,
        careerPath: p.careerPath,
        careerId: p.careerId,
        skillCount: p.skills.length,
        createdAt: p.createdAt,
      })),
      activePath: skillPath.activePath,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete path" });
  }
};

// PATCH /api/skill-path/skills/:skillId
// ✅ UPDATED: Works with active path
const updateSkillStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["learned", "learning", "to-learn"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });

    const skillPath = await SkillPath.findOne({ user: req.user.id });
    if (!skillPath)
      return res
        .status(404)
        .json({ success: false, message: "Skill path not found" });

    // ✅ Find active path
    const activePath = skillPath.paths.find(
      (p) => p._id.toString() === skillPath.activePath.toString(),
    );
    if (!activePath)
      return res
        .status(404)
        .json({ success: false, message: "Active path not found" });

    const skill = activePath.skills.id(req.params.skillId);
    if (!skill)
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });

    skill.status = status;
    await skillPath.save();

    res
      .status(200)
      .json({ success: true, message: "Skill updated!", data: skillPath });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update skill" });
  }
};

// ✅ HELPER: Map skill category to valid goal category
const mapSkillCategoryToGoalCategory = (skillCategory) => {
  const categoryMap = {
    "Frontend Development": "Learning",
    "Backend Development": "Learning",
    "Full Stack": "Learning",
    "Mobile Development": "Learning",
    "Cloud & DevOps": "Learning",
    "Data & Analytics": "Learning",
    "AI & Machine Learning": "Learning",
    "Soft Skills": "Career",
    Leadership: "Career",
    Language: "Learning",
    Technical: "Learning",
    Creative: "Career",
    Design: "Learning",
    Business: "Career",
    Finance: "Finance",
    Health: "Health",
    Personal: "Personal",
  };

  return categoryMap[skillCategory] || "Learning";
};

// ✅ POST /api/skill-path/skills/:skillId/add-goal
const addSkillToGoal = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.user.id;

    const skillPath = await SkillPath.findOne({ user: userId });
    if (!skillPath) {
      return res.status(404).json({
        success: false,
        message: "Skill path not found",
      });
    }

    // ✅ Find skill in active path
    const activePath = skillPath.paths.find(
      (p) => p._id.toString() === skillPath.activePath.toString(),
    );
    if (!activePath) {
      return res.status(404).json({
        success: false,
        message: "Active path not found",
      });
    }

    const skill = activePath.skills.find((s) => s._id.toString() === skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    const goalCategory = mapSkillCategoryToGoalCategory(skill.category);

    const newGoal = await Goal.create({
      userId: userId,
      title: `Learn ${skill.name}`,
      description: `Master the skill of ${skill.name} in the ${skill.category} category.`,
      category: goalCategory,
      priority: "Medium",
      status: "archived",
      duration: 30,
      dayCompletion: {},
      linkedHabits: [],
    });

    skill.addedToGoal = true;
    await skillPath.save();

    res.json({
      success: true,
      message: `Goal created for ${skill.name}! Go to Goals page to activate it.`,
      data: newGoal,
    });
  } catch (error) {
    console.error("addSkillToGoal error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/skill-path/resources/:skillName
const getSkillLearningResources = (req, res) => {
  try {
    const skillName = decodeURIComponent(req.params.skillName);
    const resources = getSkillResources(skillName);
    res.status(200).json({ success: true, data: { skillName, ...resources } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get resources" });
  }
};

// GET /api/skill-path/careers/:id
const getCareerDetails = (req, res) => {
  const career = careerPaths.find((p) => p.id === req.params.id);
  if (!career)
    return res
      .status(404)
      .json({ success: false, message: "Career path not found" });
  res.status(200).json({ success: true, data: career });
};

module.exports = {
  getCareers,
  getSkillPath,
  selectCareerPath,
  activatePath,
  deletePath,
  updateSkillStatus,
  addSkillToGoal,
  getSkillLearningResources,
  getCareerDetails,
};
