const Skill = require("../models/Skill");

// @desc  Get skills for logged-in user (creates default if none)
// @route GET /api/skills
const getSkills = async (req, res) => {
  try {
    let skillDoc = await Skill.findOne({ user: req.user.id });

    // Auto-create with defaults on first visit
    if (!skillDoc) {
      skillDoc = await Skill.create({ user: req.user.id });
    }

    res.status(200).json({ success: true, data: skillDoc });
  } catch (error) {
    console.error("getSkills error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch skills" });
  }
};

// @desc  Save skill assessment
// @route PUT /api/skills
const saveSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Skills array is required" });
    }

    // Validate each skill entry
    for (const s of skills) {
      if (!s.name || s.current == null || s.desired == null) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Each skill needs name, current, and desired",
          });
      }
    }

    const skillDoc = await Skill.findOneAndUpdate(
      { user: req.user.id },
      { skills },
      { new: true, upsert: true, runValidators: true },
    );

    res
      .status(200)
      .json({ success: true, message: "Skills saved!", data: skillDoc });
  } catch (error) {
    console.error("saveSkills error:", error);
    res.status(500).json({ success: false, message: "Failed to save skills" });
  }
};

// @desc  Generate SWOT based on current skills
// @route POST /api/skills/swot
const generateSwot = async (req, res) => {
  try {
    const skillDoc = await Skill.findOne({ user: req.user.id });

    if (!skillDoc) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No skill assessment found. Save your skills first.",
        });
    }

    const skills = skillDoc.skills;

    // Generate SWOT dynamically based on skill levels
    const strong = skills.filter((s) => s.current >= 4);
    const weak = skills.filter((s) => s.current <= 2);
    const gap = skills.filter((s) => s.desired - s.current >= 2);

    const swot = {
      strengths: strong.length
        ? strong.map((s) => `Strong ${s.name} skills (${s.current}/5)`)
        : ["Consistent learner", "Growth mindset"],
      weaknesses: weak.length
        ? weak.map((s) => `${s.name} needs improvement (${s.current}/5)`)
        : ["Room to grow in all areas"],
      opportunities: gap.length
        ? gap.map(
            (s) =>
              `Upskill ${s.name} from ${s.current} to ${s.desired} — high impact`,
          )
        : [
            "Maintain and deepen existing strengths",
            "Explore advanced certifications",
          ],
      threats: [
        "Rapidly changing technology landscape",
        "Competitive job market requires continuous learning",
        gap.length > 2
          ? "Multiple skill gaps may slow career progression"
          : "Stay consistent to avoid skill stagnation",
      ],
    };

    // Save SWOT to DB
    skillDoc.swot = swot;
    await skillDoc.save();

    res
      .status(200)
      .json({ success: true, message: "SWOT generated!", data: skillDoc });
  } catch (error) {
    console.error("generateSwot error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate SWOT" });
  }
};

module.exports = { getSkills, saveSkills, generateSwot };
