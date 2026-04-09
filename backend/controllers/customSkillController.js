const CustomSkill = require("../models/CustomSkill");
const Goal = require("../models/Goal");

// GET /api/custom-skills
const getCustomSkills = async (req, res) => {
  try {
    const skills = await CustomSkill.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: skills });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch custom skills" });
  }
};

// POST /api/custom-skills
// alreadyKnows comes as array of strings
// wantsToLearn comes as array of strings → stored as [{name, addedToGoal:false}]
const createCustomSkill = async (req, res) => {
  try {
    const {
      skillName,
      alreadyKnows,
      wantsToLearn,
      description,
      category,
      status,
    } = req.body;
    if (!skillName?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Skill name is required" });

    // Normalise alreadyKnows — accept string or array
    let knowsArr = [];
    if (Array.isArray(alreadyKnows)) knowsArr = alreadyKnows.filter(Boolean);
    else if (typeof alreadyKnows === "string")
      knowsArr = alreadyKnows
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    // Normalise wantsToLearn — each becomes { name, addedToGoal: false }
    let wantsArr = [];
    if (Array.isArray(wantsToLearn))
      wantsArr = wantsToLearn
        .filter(Boolean)
        .map((n) => ({ name: n, addedToGoal: false }));
    else if (typeof wantsToLearn === "string")
      wantsArr = wantsToLearn
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n) => ({ name: n, addedToGoal: false }));

    const skill = await CustomSkill.create({
      user: req.user.id,
      skillName,
      description: description || "",
      alreadyKnows: knowsArr,
      wantsToLearn: wantsArr,
      category: category || "Technical",
      status: status || "current",
    });
    res
      .status(201)
      .json({ success: true, message: "Custom skill added!", data: skill });
  } catch (err) {
    console.error("createCustomSkill error:", err);
    res.status(500).json({ success: false, message: "Failed to add skill" });
  }
};

// PUT /api/custom-skills/:id
const updateCustomSkill = async (req, res) => {
  try {
    const skill = await CustomSkill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true },
    );
    if (!skill)
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });
    res
      .status(200)
      .json({ success: true, message: "Skill updated!", data: skill });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update skill" });
  }
};

// DELETE /api/custom-skills/:id
const deleteCustomSkill = async (req, res) => {
  try {
    const skill = await CustomSkill.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!skill)
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });
    res.status(200).json({ success: true, message: "Skill deleted!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete skill" });
  }
};

// POST /api/custom-skills/:skillId/tags/:tagId/add-goal
// Adds a single "want to learn" tag as a Goal
const addTagToGoal = async (req, res) => {
  try {
    const skill = await CustomSkill.findOne({
      _id: req.params.skillId,
      user: req.user.id,
    });
    if (!skill)
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });

    const tag = skill.wantsToLearn.id(req.params.tagId);
    if (!tag)
      return res.status(404).json({ success: false, message: "Tag not found" });

    if (tag.addedToGoal)
      return res
        .status(400)
        .json({ success: false, message: "Already added to goals!" });

    // Create Goal for this specific tag
    await Goal.create({
      user: req.user.id,
      title: `Learn ${tag.name}`,
      description: `Master ${tag.name} as part of learning ${skill.skillName} (${skill.category}).`,
      category: "Career",
      goalType: "Professional",
      priority: "Medium",
      status: "Not Started",
      progress: 0,
      tags: [skill.skillName, skill.category, tag.name],
    });

    tag.addedToGoal = true;
    await skill.save();

    res.status(201).json({
      success: true,
      message: `🎯 "Learn ${tag.name}" added to your Goals!`,
      data: skill,
    });
  } catch (err) {
    console.error("addTagToGoal error:", err);
    res.status(500).json({ success: false, message: "Failed to add to goals" });
  }
};

module.exports = {
  getCustomSkills,
  createCustomSkill,
  updateCustomSkill,
  deleteCustomSkill,
  addTagToGoal,
};
