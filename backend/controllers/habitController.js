const Habit = require("../models/Habit");

// @desc  Get all habits for logged-in user
// @route GET /api/habits
const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id }).sort({
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: habits });
  } catch (error) {
    console.error("getHabits error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch habits" });
  }
};

// @desc  Create a habit
// @route POST /api/habits
const createHabit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Habit name is required" });
    }

    const habit = await Habit.create({
      user: req.user.id,
      name,
      days: Array(21).fill(false),
    });

    res
      .status(201)
      .json({ success: true, message: "Habit created!", data: habit });
  } catch (error) {
    console.error("createHabit error:", error);
    res.status(500).json({ success: false, message: "Failed to create habit" });
  }
};

// @desc  Toggle a specific day for a habit
// @route PATCH /api/habits/:id/toggle/:dayIndex
const toggleDay = async (req, res) => {
  try {
    const { id, dayIndex } = req.params;
    const idx = parseInt(dayIndex);

    if (isNaN(idx) || idx < 0 || idx > 20) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid day index (0-20)" });
    }

    const habit = await Habit.findOne({ _id: id, user: req.user.id });

    if (!habit) {
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });
    }

    habit.days[idx] = !habit.days[idx];
    habit.markModified("days"); // required for array mutation in mongoose
    await habit.save();

    res
      .status(200)
      .json({ success: true, message: "Day toggled!", data: habit });
  } catch (error) {
    console.error("toggleDay error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle day" });
  }
};

// @desc  Delete a habit
// @route DELETE /api/habits/:id
const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!habit) {
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });
    }

    res.status(200).json({ success: true, message: "Habit deleted!" });
  } catch (error) {
    console.error("deleteHabit error:", error);
    res.status(500).json({ success: false, message: "Failed to delete habit" });
  }
};

module.exports = { getHabits, createHabit, toggleDay, deleteHabit };
