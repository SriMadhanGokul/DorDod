const Activity = require("../models/Activity");
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const Achievement = require("../models/Achievement");

// ── Suggest activities for a goal using simple keyword logic ──────────────────
const SUGGESTIONS = {
  Career: [
    "Research the topic",
    "Create a study schedule",
    "Complete one tutorial",
    "Build a practice project",
    "Review and revise notes",
    "Share progress with a mentor",
  ],
  Fitness: [
    "Morning workout session",
    "Track calories for the day",
    "Drink 8 glasses of water",
    "Rest and recovery",
    "Stretching routine",
    "Cardio session",
  ],
  Financial: [
    "Review monthly budget",
    "Track daily expenses",
    "Research investment options",
    "Set savings milestone",
    "Consult a financial guide",
  ],
  Intellectual: [
    "Read for 30 minutes",
    "Watch an educational video",
    "Write a summary of learning",
    "Discuss topic with peers",
    "Take practice quiz",
  ],
  Spiritual: [
    "Morning meditation",
    "Journaling session",
    "Gratitude practice",
    "Mindfulness exercise",
    "Read inspirational content",
  ],
  Social: [
    "Reach out to someone new",
    "Attend a networking event",
    "Schedule a catch-up call",
    "Join a community group",
  ],
  Family: [
    "Plan a family activity",
    "Have a meaningful conversation",
    "Cook a meal together",
    "Share a learning with family",
  ],
  Other: [
    "Break task into smaller steps",
    "Research and plan",
    "Take action on first step",
    "Review progress",
    "Celebrate small wins",
  ],
};

const getSuggestions = (category) =>
  (SUGGESTIONS[category] || SUGGESTIONS["Other"]).map((title) => ({
    title,
    autoSuggested: true,
  }));

// GET /api/activities
const getActivities = async (req, res) => {
  try {
    const { goalId, status } = req.query;
    const filter = { user: req.user.id };
    if (goalId) filter.goalId = goalId;
    if (status && status !== "all") filter.status = status;

    const activities = await Activity.find(filter)
      .populate("goalId", "title category")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: activities });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch activities" });
  }
};

// GET /api/activities/suggestions/:goalId
const getActivitySuggestions = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.goalId,
      user: req.user.id,
    });
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    const suggestions = getSuggestions(goal.category);
    res
      .status(200)
      .json({ success: true, data: suggestions, goalTitle: goal.title });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get suggestions" });
  }
};

// POST /api/activities
const createActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      goalId,
      subGoalId,
      autoSuggested,
    } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });

    let goalTitle = "";
    if (goalId) {
      const goal = await Goal.findById(goalId).select("title");
      goalTitle = goal?.title || "";
    }

    const activity = await Activity.create({
      user: req.user.id,
      title,
      description: description || "",
      priority: priority || "Medium",
      dueDate: dueDate || null,
      goalId: goalId || null,
      subGoalId: subGoalId || null,
      goalTitle,
      autoSuggested: autoSuggested || false,
    });

    res
      .status(201)
      .json({ success: true, message: "Activity created!", data: activity });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create activity" });
  }
};

// PATCH /api/activities/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["todo", "inprogress", "done"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });

    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true },
    ).populate("goalId", "title category");

    if (!activity)
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    res
      .status(200)
      .json({ success: true, message: "Status updated!", data: activity });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
};

// POST /api/activities/:id/add-habit  — create a habit with schedule
const addToHabit = async (req, res) => {
  try {
    const { reminderTime, frequency } = req.body; // e.g. "08:00", "daily"
    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!activity)
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    if (activity.addedToHabit)
      return res
        .status(400)
        .json({ success: false, message: "Already added to habits!" });

    const habit = await Habit.create({
      user: req.user.id,
      name: activity.title,
      days: Array(21).fill(false),
      reminderTime: reminderTime || null,
      frequency: frequency || "daily",
      fromActivity: activity._id,
      fromGoal: activity.goalTitle || "",
    });

    activity.addedToHabit = true;
    activity.habitId = habit._id;
    await activity.save();

    res.status(201).json({
      success: true,
      message: `✅ "${activity.title}" added as a daily habit!`,
      data: { activity, habit },
    });
  } catch (err) {
    console.error("addToHabit error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to add to habits" });
  }
};

// POST /api/activities/:id/add-achievement  — create achievement from done activity
const addToAchievement = async (req, res) => {
  try {
    const { description } = req.body;
    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!activity)
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    if (activity.status !== "done")
      return res
        .status(400)
        .json({ success: false, message: "Activity must be Done first" });
    if (activity.addedToAchievement)
      return res
        .status(400)
        .json({ success: false, message: "Already added as achievement!" });

    await Achievement.create({
      user: req.user.id,
      title: activity.title,
      description:
        description ||
        `Completed activity: ${activity.title}${activity.goalTitle ? ` (Goal: ${activity.goalTitle})` : ""}`,
      type: "Performance",
      date: new Date(),
      linkedGoal: activity.goalId || null,
      autoGenerated: false,
      progress: 100,
    });

    activity.addedToAchievement = true;
    await activity.save();

    res.status(201).json({
      success: true,
      message: `🏆 "${activity.title}" added as an Achievement!`,
      data: activity,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create achievement" });
  }
};

// DELETE /api/activities/:id
const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!activity)
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    res.status(200).json({ success: true, message: "Activity deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete activity" });
  }
};

module.exports = {
  getActivities,
  getActivitySuggestions,
  createActivity,
  updateStatus,
  addToHabit,
  addToAchievement,
  deleteActivity,
};
