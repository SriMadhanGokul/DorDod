const Activity = require("../models/Activity");

// GET /api/activities
const getActivities = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };
    if (status && status !== "All") filter.status = status;
    const activities = await Activity.find(filter)
      .populate("linkedGoal", "title")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: activities });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch activities" });
  }
};

// POST /api/activities
const createActivity = async (req, res) => {
  try {
    const { title, description, linkedGoal, dueDate } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    const activity = await Activity.create({
      user: req.user.id,
      title,
      description,
      linkedGoal: linkedGoal || null,
      dueDate,
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

// PUT /api/activities/:id  — update status
const updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!activity)
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    const allowed = ["title", "description", "status", "dueDate", "linkedGoal"];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) activity[f] = req.body[f];
    });
    await activity.save();
    res
      .status(200)
      .json({ success: true, message: "Activity updated!", data: activity });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update activity" });
  }
};

// POST /api/activities/:id/updates  — add update note
const addUpdate = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Update text is required" });
    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!activity)
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    activity.updates.push({ text });
    await activity.save();
    res
      .status(201)
      .json({ success: true, message: "Update added!", data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add update" });
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
  createActivity,
  updateActivity,
  addUpdate,
  deleteActivity,
};
