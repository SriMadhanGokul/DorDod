const User = require("../models/User");
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const Achievement = require("../models/Achievement");
const SkillPath = require("../models/SkillPath");
const { Enrollment } = require("../models/Course");
const Post = require("../models/Post");

// GET /api/admin/users?page=1&limit=10&search=
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "all"; // all | active | suspended

    const filter = { role: "user" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (status === "active") filter.suspended = false;
    if (status === "suspended") filter.suspended = true;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("name email createdAt suspended role avatar subscription")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: { users, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// GET /api/admin/users/:id
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const [goals, habits, achievements, skillPath, enrollments, posts] =
      await Promise.all([
        Goal.find({ user: req.params.id }).sort({ createdAt: -1 }),
        Habit.find({ user: req.params.id }),
        Achievement.find({ user: req.params.id }).populate(
          "linkedGoal",
          "title",
        ),
        SkillPath.findOne({ user: req.params.id }),
        Enrollment.find({ user: req.params.id }).populate(
          "course",
          "title category",
        ),
        Post.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(5),
      ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        goals,
        habits,
        achievements,
        skillPath,
        enrollments,
        posts,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user details" });
  }
};

// PATCH /api/admin/users/:id/suspend
const toggleSuspend = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.role === "admin")
      return res
        .status(400)
        .json({ success: false, message: "Cannot suspend admin" });

    user.suspended = !user.suspended;
    user.suspendedReason = user.suspended ? reason || "Suspended by admin" : "";
    await user.save();

    res.status(200).json({
      success: true,
      message: user.suspended ? "User suspended" : "User activated",
      data: { suspended: user.suspended },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.role === "admin")
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete admin" });

    // Delete all user data
    await Promise.all([
      Goal.deleteMany({ user: req.params.id }),
      Habit.deleteMany({ user: req.params.id }),
      Achievement.deleteMany({ user: req.params.id }),
      SkillPath.deleteOne({ user: req.params.id }),
      Enrollment.deleteMany({ user: req.params.id }),
      Post.deleteMany({ user: req.params.id }),
      User.findByIdAndDelete(req.params.id),
    ]);

    res
      .status(200)
      .json({
        success: true,
        message: "User and all data deleted successfully",
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

// PATCH /api/admin/users/:id/role
const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ success: false, message: "Invalid role" });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    );
    res
      .status(200)
      .json({ success: true, message: `Role changed to ${role}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to change role" });
  }
};

module.exports = {
  getAllUsers,
  getUserDetails,
  toggleSuspend,
  deleteUser,
  changeRole,
};
