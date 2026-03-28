const SkillPath = require("../models/SkillPath");
const Goal = require("../models/Goal");
const careerPaths = require("../data/careerPaths");
const { getSkillResources } = require("../data/skillResources");

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
const getSkillPath = async (req, res) => {
  try {
    const skillPath = await SkillPath.findOne({ user: req.user.id });
    res.status(200).json({ success: true, data: skillPath || null });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch skill path" });
  }
};

// POST /api/skill-path/select
const selectCareerPath = async (req, res) => {
  try {
    const { careerId } = req.body;
    const career = careerPaths.find((p) => p.id === careerId);
    if (!career)
      return res
        .status(404)
        .json({ success: false, message: "Career path not found" });

    const existing = await SkillPath.findOne({ user: req.user.id });
    if (existing && existing.careerPath === career.title)
      return res
        .status(200)
        .json({
          success: true,
          message: "Career path loaded!",
          data: existing,
        });

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

    const skillPath = await SkillPath.findOneAndUpdate(
      { user: req.user.id },
      { careerPath: career.title, skills },
      { new: true, upsert: true },
    );

    res
      .status(200)
      .json({
        success: true,
        message: `${career.emoji} ${career.title} selected!`,
        data: skillPath,
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to select career path" });
  }
};

// PATCH /api/skill-path/skills/:skillId
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

    const skill = skillPath.skills.id(req.params.skillId);
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

// POST /api/skill-path/skills/:skillId/add-goal
const addSkillToGoal = async (req, res) => {
  try {
    const skillPath = await SkillPath.findOne({ user: req.user.id });
    if (!skillPath)
      return res
        .status(404)
        .json({ success: false, message: "Skill path not found" });

    const skill = skillPath.skills.id(req.params.skillId);
    if (!skill)
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });

    if (skill.addedToGoal)
      return res
        .status(400)
        .json({ success: false, message: "Already added to goals!" });

    const intellectualCats = ["Math", "ML Libraries", "Concepts", "Statistics"];
    await Goal.create({
      user: req.user.id,
      title: `Learn ${skill.name}`,
      description: `Master ${skill.name} as part of my ${skillPath.careerPath} learning path. Category: ${skill.category}.`,
      category: intellectualCats.includes(skill.category)
        ? "Intellectual"
        : "Career",
      goalType: "Professional",
      priority: "Medium",
      status: "Not Started",
      progress: 0,
      tags: [skill.category, skillPath.careerPath],
    });

    skill.addedToGoal = true;
    await skillPath.save();

    res.status(201).json({
      success: true,
      message: `🎯 "Learn ${skill.name}" added to your Goals!`,
      data: skillPath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to add to goals" });
  }
};

// GET /api/skill-path/resources/:skillName — get YouTube + course info for a skill
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
  updateSkillStatus,
  addSkillToGoal,
  getSkillLearningResources,
  getCareerDetails,
};
