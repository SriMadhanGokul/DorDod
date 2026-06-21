const CustomSkill = require("../models/CustomSkill");
const Goal = require("../models/Goal");

// ✅ GET ALL CUSTOM SKILLS FOR USER
const getCustomSkills = async (req, res) => {
  try {
    const skills = await CustomSkill.find({ user: req.user.id }).populate(
      "linkedGoal",
      "title",
    );
    res.json({
      success: true,
      data: skills || [],
    });
  } catch (error) {
    console.error("getCustomSkills error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom skills",
    });
  }
};

// ✅ CREATE MULTIPLE CUSTOM SKILLS (with common description/category/status)
const createCustomSkill = async (req, res) => {
  try {
    const { skillNames, description, category, status } = req.body;

    // ✅ Validate required fields
    if (!skillNames || !Array.isArray(skillNames) || skillNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one skill name is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Validate status
    const validStatuses = ["to-learn", "learning", "learned"];
    const finalStatus = validStatuses.includes(status) ? status : "to-learn";

    // ✅ Create skill for each skill name
    const createdSkills = [];
    for (const skillName of skillNames) {
      if (!skillName || !skillName.trim()) continue;

      const customSkill = new CustomSkill({
        user: req.user.id,
        skillName: skillName.trim(),
        description: description.trim(),
        category: category,
        status: finalStatus,
      });

      const saved = await customSkill.save();
      createdSkills.push(saved);
    }

    if (createdSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid skill names provided",
      });
    }

    res.status(201).json({
      success: true,
      message: `${createdSkills.length} custom skill(s) created successfully`,
      data: createdSkills,
    });
  } catch (error) {
    console.error("createCustomSkill error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create custom skill",
      error: error.message,
    });
  }
};

// ✅ GET SINGLE CUSTOM SKILL
const getCustomSkill = async (req, res) => {
  try {
    const skill = await CustomSkill.findById(req.params.id).populate(
      "linkedGoal",
      "title description",
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Custom skill not found",
      });
    }

    if (skill.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this skill",
      });
    }

    res.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    console.error("getCustomSkill error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom skill",
    });
  }
};

// ✅ UPDATE CUSTOM SKILL
const updateCustomSkill = async (req, res) => {
  try {
    const { description, status, category } = req.body;

    let skill = await CustomSkill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Custom skill not found",
      });
    }

    if (skill.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this skill",
      });
    }

    // Update fields
    if (description !== undefined && description.trim()) {
      skill.description = description.trim();
    }
    if (category !== undefined) {
      skill.category = category;
    }
    if (status !== undefined) {
      const validStatuses = ["to-learn", "learning", "learned"];
      if (validStatuses.includes(status)) {
        skill.status = status;
      }
    }

    await skill.save();
    await skill.populate("linkedGoal", "title");

    res.json({
      success: true,
      message: "Custom skill updated successfully",
      data: skill,
    });
  } catch (error) {
    console.error("updateCustomSkill error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update custom skill",
      error: error.message,
    });
  }
};

// ✅ DELETE CUSTOM SKILL
const deleteCustomSkill = async (req, res) => {
  try {
    const skill = await CustomSkill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Custom skill not found",
      });
    }

    if (skill.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this skill",
      });
    }

    // If linked to goal, unlink it
    if (skill.linkedGoal) {
      await Goal.findByIdAndUpdate(skill.linkedGoal, {
        $pull: { linkedSkills: req.params.id },
      });
    }

    await CustomSkill.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Custom skill deleted successfully",
    });
  } catch (error) {
    console.error("deleteCustomSkill error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete custom skill",
    });
  }
};

// ✅ LINK CUSTOM SKILL TO GOAL
const linkSkillToGoal = async (req, res) => {
  try {
    const { goalId } = req.body;
    const { id } = req.params;

    // Validate goal exists
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    // Validate goal belongs to user
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to link skills to this goal",
      });
    }

    // Get the skill
    let skill = await CustomSkill.findById(id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Custom skill not found",
      });
    }

    // Verify user owns the skill
    if (skill.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to link this skill",
      });
    }

    // Unlink from previous goal if linked
    if (skill.linkedGoal && skill.linkedGoal.toString() !== goalId) {
      await Goal.findByIdAndUpdate(skill.linkedGoal, {
        $pull: { linkedSkills: id },
      });
    }

    // Link to new goal
    skill.linkedGoal = goalId;
    await skill.save();

    // Add skill to goal's linkedSkills array if not already there
    if (!goal.linkedSkills) {
      goal.linkedSkills = [];
    }
    if (!goal.linkedSkills.includes(id)) {
      goal.linkedSkills.push(id);
      await goal.save();
    }

    await skill.populate("linkedGoal", "title");

    res.json({
      success: true,
      message: "Skill linked to goal successfully",
      data: skill,
    });
  } catch (error) {
    console.error("linkSkillToGoal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to link skill to goal",
    });
  }
};

// ✅ UNLINK CUSTOM SKILL FROM GOAL
const unlinkSkillFromGoal = async (req, res) => {
  try {
    const { id } = req.params;

    let skill = await CustomSkill.findById(id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Custom skill not found",
      });
    }

    if (skill.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const previousGoalId = skill.linkedGoal;

    // Unlink from goal
    skill.linkedGoal = null;
    await skill.save();

    // Remove from goal
    if (previousGoalId) {
      await Goal.findByIdAndUpdate(previousGoalId, {
        $pull: { linkedSkills: id },
      });
    }

    res.json({
      success: true,
      message: "Skill unlinked from goal successfully",
      data: skill,
    });
  } catch (error) {
    console.error("unlinkSkillFromGoal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unlink skill from goal",
    });
  }
};

// ✅ EXPORT ALL FUNCTIONS
module.exports = {
  getCustomSkills,
  createCustomSkill,
  getCustomSkill,
  updateCustomSkill,
  deleteCustomSkill,
  linkSkillToGoal,
  unlinkSkillFromGoal,
};
