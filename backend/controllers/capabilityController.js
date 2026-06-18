const SkillPath = require("../models/SkillPath");
const CustomSkill = require("../models/CustomSkill");

// @desc  Get all capabilities (skill categories) with learned/total count
// @route GET /api/capabilities
exports.getCapabilities = async (req, res) => {
  try {
    // Get career path skills
    const skillPath = await SkillPath.findOne({ user: req.user.id });

    // Get custom skills
    const customSkills = await CustomSkill.find({ user: req.user.id });

    // Combine and group by category
    const allSkills = [];

    // Add career path skills
    if (skillPath && skillPath.skills) {
      skillPath.skills.forEach((skill) => {
        allSkills.push({
          name: skill.name,
          category: skill.category,
          status: skill.status,
          type: "career",
        });
      });
    }

    // Add custom skills
    if (customSkills && customSkills.length > 0) {
      customSkills.forEach((skill) => {
        allSkills.push({
          name: skill.skillName,
          category: skill.category,
          status:
            skill.status === "completed"
              ? "learned"
              : skill.status === "current"
                ? "learning"
                : "to-learn",
          type: "custom",
        });
      });
    }

    // Group by category and count
    const capabilityMap = {};

    allSkills.forEach((skill) => {
      const category = skill.category || "Uncategorized";

      if (!capabilityMap[category]) {
        capabilityMap[category] = {
          category,
          total: 0,
          learned: 0,
          learning: 0,
          toLearn: 0,
        };
      }

      capabilityMap[category].total += 1;

      if (skill.status === "learned") {
        capabilityMap[category].learned += 1;
      } else if (skill.status === "learning") {
        capabilityMap[category].learning += 1;
      } else {
        capabilityMap[category].toLearn += 1;
      }
    });

    // Convert to array and sort alphabetically
    const capabilities = Object.values(capabilityMap).sort((a, b) =>
      a.category.localeCompare(b.category),
    );

    // Calculate totals
    const totals = {
      total: allSkills.length,
      learned: allSkills.filter((s) => s.status === "learned").length,
      learning: allSkills.filter((s) => s.status === "learning").length,
      toLearn: allSkills.filter((s) => s.status === "to-learn").length,
    };

    res.status(200).json({
      success: true,
      data: {
        capabilities,
        totals,
        breakdownPercentage:
          totals.total > 0
            ? Math.round((totals.learned / totals.total) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("getCapabilities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch capabilities",
    });
  }
};

// @desc  Get capability summary for dashboard (just the totals)
// @route GET /api/capabilities/summary
exports.getCapabilitiesSummary = async (req, res) => {
  try {
    const skillPath = await SkillPath.findOne({ user: req.user.id });
    const customSkills = await CustomSkill.find({ user: req.user.id });

    let totalSkills = 0;
    let learnedSkills = 0;

    // Count from career path
    if (skillPath && skillPath.skills) {
      totalSkills += skillPath.skills.length;
      learnedSkills += skillPath.skills.filter(
        (s) => s.status === "learned",
      ).length;
    }

    // Count from custom skills
    if (customSkills && customSkills.length > 0) {
      totalSkills += customSkills.length;
      learnedSkills += customSkills.filter(
        (s) => s.status === "completed",
      ).length;
    }

    res.status(200).json({
      success: true,
      data: {
        completed: learnedSkills,
        total: totalSkills,
      },
    });
  } catch (error) {
    console.error("getCapabilitiesSummary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch capabilities summary",
    });
  }
};
