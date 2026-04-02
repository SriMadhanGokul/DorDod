const User = require("../models/User");
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const Post = require("../models/Post");
const { Enrollment } = require("../models/Course");
const Achievement = require("../models/Achievement");
const SkillPath = require("../models/SkillPath");

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      newUsersThisMonth,
      totalGoals,
      completedGoals,
      totalHabits,
      totalPosts,
      totalEnrollments,
      totalAchievements,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", suspended: false }),
      User.countDocuments({ suspended: true }),
      User.countDocuments({ createdAt: { $gte: month } }),
      Goal.countDocuments(),
      Goal.countDocuments({ status: "Completed" }),
      Habit.countDocuments(),
      Post.countDocuments(),
      Enrollment.countDocuments(),
      Achievement.countDocuments(),
    ]);

    // Monthly user growth (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = await User.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });
      months.push({
        month: d.toLocaleString("default", { month: "short" }),
        users: count,
      });
    }

    // Top career paths
    const careerPaths = await SkillPath.aggregate([
      { $group: { _id: "$careerPath", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Recent users
    const recentUsers = await User.find({ role: "user" })
      .select("name email createdAt suspended")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          newUsersThisMonth,
          totalGoals,
          completedGoals,
          totalHabits,
          totalPosts,
          totalEnrollments,
          totalAchievements,
        },
        monthlyGrowth: months,
        careerPaths: careerPaths.map((c) => ({
          name: c._id || "Not Selected",
          count: c.count,
        })),
        recentUsers,
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};

module.exports = { getDashboardStats };
