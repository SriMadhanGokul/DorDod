const Habit = require("../models/Habit");
const { awardXP } = require("./xpController");
const UserScore = require("../models/UserScore");

const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id }).sort({
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: habits });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch habits" });
  }
};

const createHabit = async (req, res) => {
  try {
    const { name, days } = req.body;
    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Habit name is required" });
    const habit = await Habit.create({
      user: req.user.id,
      name,
      days: days || Array(21).fill(false),
    });
    res
      .status(201)
      .json({ success: true, message: "Habit created!", data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create habit" });
  }
};

const toggleDay = async (req, res) => {
  try {
    const { id, dayIndex: paramIdx } = req.params;
    const bodyIdx = req.body?.dayIndex;
    const idx = parseInt(paramIdx ?? bodyIdx);

    if (isNaN(idx) || idx < 0 || idx > 20)
      return res
        .status(400)
        .json({ success: false, message: "Invalid day index (0-20)" });

    const habit = await Habit.findOne({ _id: id, user: req.user.id });
    if (!habit)
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });

    // Block toggling a day if habit is fully completed (all 21 done)
    const wasCompleted = habit.days.filter(Boolean).length === 21;
    if (wasCompleted)
      return res
        .status(400)
        .json({
          success: false,
          message: "🔒 Completed habits cannot be modified",
        });

    const wasDone = habit.days[idx];
    habit.days[idx] = !habit.days[idx];
    habit.markModified("days");
    await habit.save();

    // Award XP only when MARKING as done (not when unchecking)
    if (!wasDone && habit.days[idx]) {
      awardXP(req.user.id, "habit_day").catch(console.error);
    }

    res
      .status(200)
      .json({ success: true, message: "Day toggled!", data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle day" });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!habit)
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });

    // Block deletion if habit is fully completed
    const completedDays = habit.days.filter(Boolean).length;
    if (completedDays === 21)
      return res
        .status(400)
        .json({
          success: false,
          message: "🔒 Completed habits cannot be deleted",
        });

    // Deduct XP for the completed days being removed
    if (completedDays > 0) {
      const deductXP = completedDays * 10; // 10 XP per day
      const score = await UserScore.findOne({ user: req.user.id });
      if (score) {
        score.totalXP = Math.max(0, score.totalXP - deductXP);
        score.recalcLevel();
        score.history.push({
          type: "habit_deleted",
          points: -deductXP,
          description: `Habit "${habit.name}" deleted — ${completedDays} days XP removed`,
          createdAt: new Date(),
        });
        await score.save();
      }
    }

    await Habit.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Habit deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete habit" });
  }
};

module.exports = { getHabits, createHabit, toggleDay, deleteHabit };
