const Goal = require("../models/Goal");
const { Course } = require("../models/Course");
const SkillPath = require("../models/SkillPath");
const Post = require("../models/Post");
const CustomSkill = require("../models/CustomSkill");

// GET /api/search?q=react
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res
        .status(400)
        .json({
          success: false,
          message: "Query must be at least 2 characters",
        });

    const regex = new RegExp(q.trim(), "i");
    const userId = req.user.id;

    const [goals, courses, posts, customSkills, skillPath] = await Promise.all([
      Goal.find({
        user: userId,
        $or: [{ title: regex }, { description: regex }, { tags: regex }],
      })
        .select("title description status progress category")
        .limit(5),
      Course.find({
        status: "approved",
        $or: [{ title: regex }, { skillTag: regex }, { category: regex }],
      })
        .select("title category skillTag duration instructor")
        .limit(5),
      Post.find({ content: regex })
        .populate("user", "name")
        .select("content createdAt")
        .limit(5),
      CustomSkill.find({
        user: userId,
        $or: [{ skillName: regex }, { description: regex }],
      })
        .select("skillName category status")
        .limit(5),
      SkillPath.findOne({ user: userId }),
    ]);

    // Skills from career path
    const skills = skillPath
      ? skillPath.skills
          .filter((s) => regex.test(s.name) || regex.test(s.category))
          .slice(0, 5)
          .map((s) => ({
            name: s.name,
            category: s.category,
            status: s.status,
            type: "career_skill",
          }))
      : [];

    const results = {
      goals: goals.map((g) => ({ ...g.toObject(), type: "goal" })),
      courses: courses.map((c) => ({ ...c.toObject(), type: "course" })),
      posts: posts.map((p) => ({ ...p.toObject(), type: "post" })),
      customSkills: customSkills.map((s) => ({
        ...s.toObject(),
        type: "custom_skill",
      })),
      skills,
      total:
        goals.length +
        courses.length +
        posts.length +
        customSkills.length +
        skills.length,
    };

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("globalSearch error:", err);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

module.exports = { globalSearch };
