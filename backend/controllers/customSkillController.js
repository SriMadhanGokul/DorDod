const CustomSkill = require("../models/CustomSkill");

// ✅ HELPER: Normalize array data - convert objects to strings
const normalizeArray = (data) => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item.name) return item.name;
      if (typeof item === "object" && item.skillName) return item.skillName;
      return String(item).trim();
    })
    .filter((item) => item && item.length > 0);
};

// ✅ GET ALL CUSTOM SKILLS FOR USER
const getCustomSkills = async (req, res) => {
  try {
    const skills = await CustomSkill.find({ user: req.user.id });
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

// ✅ CREATE CUSTOM SKILL
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

    // Validate required fields
    if (!skillName || !skillName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Skill name is required",
      });
    }

    // Validate status
    const validStatuses = ["to-learn", "learning", "learned"];
    const finalStatus = validStatuses.includes(status) ? status : "to-learn";

    // Normalize arrays - handle both string and object formats
    const normalizedAlreadyKnows = normalizeArray(alreadyKnows);
    const normalizedWantsToLearn = normalizeArray(wantsToLearn);

    const customSkill = new CustomSkill({
      user: req.user.id,
      skillName: skillName.trim(),
      alreadyKnows: normalizedAlreadyKnows,
      wantsToLearn: normalizedWantsToLearn,
      description: description || "",
      category: category || "Technical",
      status: finalStatus,
    });

    await customSkill.save();

    res.status(201).json({
      success: true,
      message: "Custom skill created successfully",
      data: customSkill,
    });
  } catch (error) {
    console.error("createCustomSkill error:", error);

    // Handle unique constraint error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Custom skill with this name already exists",
      });
    }

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
    const { alreadyKnows, wantsToLearn, description, status, category } =
      req.body;

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

    // Update fields with normalization
    if (alreadyKnows !== undefined) {
      skill.alreadyKnows = normalizeArray(alreadyKnows);
    }
    if (wantsToLearn !== undefined) {
      skill.wantsToLearn = normalizeArray(wantsToLearn);
    }
    if (description !== undefined) {
      skill.description = description || "";
    }
    if (category !== undefined) {
      skill.category = category || "Technical";
    }
    if (status !== undefined) {
      const validStatuses = ["to-learn", "learning", "learned"];
      if (validStatuses.includes(status)) {
        skill.status = status;
      }
    }

    await skill.save();

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

// ✅ EXPORT ALL FUNCTIONS
module.exports = {
  getCustomSkills,
  createCustomSkill,
  getCustomSkill,
  updateCustomSkill,
  deleteCustomSkill,
};
