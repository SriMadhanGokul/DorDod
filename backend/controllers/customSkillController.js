const CustomSkill = require("../models/CustomSkill");

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

    const skill = await CustomSkill.create({
      user: req.user.id,
      skillName,
      alreadyKnows,
      wantsToLearn,
      description,
      category: category || "Other",
      status: status || "current",
    });
    res
      .status(201)
      .json({ success: true, message: "Custom skill added!", data: skill });
  } catch (err) {
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

module.exports = {
  getCustomSkills,
  createCustomSkill,
  updateCustomSkill,
  deleteCustomSkill,
};
