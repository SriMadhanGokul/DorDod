const Habit = require("../models/Habit");
const Goal = require("../models/Goal");

// ─── Get All Habits ──────────────────────────────────────────────────────────
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id })
      .populate("linkedGoal", "title")
      .lean();

    const habitsWithGoalTitle = habits.map((habit) => ({
      ...habit,
      linkedGoalTitle: habit.linkedGoal?.title || null,
    }));

    res.json({
      success: true,
      data: habitsWithGoalTitle,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch habits" });
  }
};

// ─── Get Habits by Goal ──────────────────────────────────────────────────────
exports.getHabitsByGoal = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user._id,
      linkedGoal: req.params.goalId,
    }).lean();

    res.json({
      success: true,
      data: habits,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch habits" });
  }
};

// ─── Get Single Habit ────────────────────────────────────────────────────────
exports.getHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate("linkedGoal", "title")
      .lean();

    if (!habit) return res.status(404).json({ message: "Habit not found" });

    res.json({
      success: true,
      data: habit,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch habit" });
  }
};

// ─── Check Time Slot Overlap ─────────────────────────────────────────────────
const checkTimeOverlap = async (
  userId,
  timeStart,
  timeEnd,
  excludeHabitId = null,
) => {
  const [startHour, startMin] = timeStart.split(":").map(Number);
  const [endHour, endMin] = timeEnd.split(":").map(Number);
  const formStart = startHour * 60 + startMin;
  const formEnd = endHour * 60 + endMin;

  const query = { userId };
  if (excludeHabitId) {
    query._id = { $ne: excludeHabitId };
  }

  const existingHabits = await Habit.find(query).lean();

  for (const habit of existingHabits) {
    if (!habit.timeStart || !habit.timeEnd) continue;

    const [eStartHour, eStartMin] = habit.timeStart.split(":").map(Number);
    const [eEndHour, eEndMin] = habit.timeEnd.split(":").map(Number);
    const existingStart = eStartHour * 60 + eStartMin;
    const existingEnd = eEndHour * 60 + eEndMin;

    if (
      (formStart < existingEnd && formEnd > existingStart) ||
      (formStart === existingStart && formEnd === existingEnd)
    ) {
      return true;
    }
  }

  return false;
};

// ─── Check if within time window ─────────────────────────────────────────────
const isWithinTimeWindow = (timeStart, timeEnd) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = timeStart.split(":").map(Number);
  const [endHour, endMin] = timeEnd.split(":").map(Number);
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;

  return currentTime >= start && currentTime < end;
};

// ─── Create Habit ───────────────────────────────────────────────────────────
exports.createHabit = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      frequency,
      timeStart,
      timeEnd,
      linkedGoal,
    } = req.body;

    if (!name || !description || !timeStart || !timeEnd) {
      return res.status(400).json({
        message: "Name, description, start time, and end time are required",
      });
    }

    if (!/^\d{2}:\d{2}$/.test(timeStart) || !/^\d{2}:\d{2}$/.test(timeEnd)) {
      return res.status(400).json({
        message: "Invalid time format. Use HH:MM",
      });
    }

    const [startHour, startMin] = timeStart.split(":").map(Number);
    const [endHour, endMin] = timeEnd.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    const hasOverlap = await checkTimeOverlap(req.user._id, timeStart, timeEnd);
    if (hasOverlap) {
      return res.status(400).json({
        message:
          "This time slot overlaps with an existing habit. Please choose a different time.",
      });
    }

    const habit = new Habit({
      userId: req.user._id,
      name,
      description,
      category: category || "Productivity",
      frequency: frequency || "Daily",
      timeStart,
      timeEnd,
      linkedGoal: linkedGoal || null,
      tracking: [],
    });

    await habit.save();

    res.status(201).json({
      success: true,
      message: "Habit created successfully",
      data: habit,
    });
  } catch (err) {
    console.error("Error creating habit:", err);
    res.status(500).json({ message: "Failed to create habit" });
  }
};

// ─── Update Habit ───────────────────────────────────────────────────────────
exports.updateHabit = async (req, res) => {
  try {
    const { name, description, category, frequency, timeStart, timeEnd } =
      req.body;

    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    if (timeStart && timeEnd) {
      const [startHour, startMin] = timeStart.split(":").map(Number);
      const [endHour, endMin] = timeEnd.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        return res.status(400).json({
          message: "End time must be after start time",
        });
      }

      if (timeStart !== habit.timeStart || timeEnd !== habit.timeEnd) {
        const hasOverlap = await checkTimeOverlap(
          req.user._id,
          timeStart,
          timeEnd,
          habit._id,
        );

        if (hasOverlap) {
          return res.status(400).json({
            message:
              "This time slot overlaps with an existing habit. Please choose a different time.",
          });
        }
      }

      habit.timeStart = timeStart;
      habit.timeEnd = timeEnd;
    }

    if (name) habit.name = name;
    if (description) habit.description = description;
    if (category) habit.category = category;
    if (frequency) habit.frequency = frequency;

    await habit.save();

    res.json({
      success: true,
      message: "Habit updated successfully",
      data: habit,
    });
  } catch (err) {
    console.error("Error updating habit:", err);
    res.status(500).json({ message: "Failed to update habit" });
  }
};

// ─── Complete Habit ──────────────────────────────────────────────────────────
exports.completeHabit = async (req, res) => {
  try {
    const habitId = req.params.id;

    if (!habitId) {
      return res.status(400).json({ message: "Habit ID is required" });
    }

    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Check if within time window
    if (habit.timeStart && habit.timeEnd) {
      const isWithinWindow = isWithinTimeWindow(habit.timeStart, habit.timeEnd);
      if (!isWithinWindow) {
        return res.status(400).json({
          message:
            "This habit is not available right now. Complete it during its scheduled time window.",
        });
      }
    }

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    // Find or create tracking entry for today
    let existingEntry = habit.tracking.find((t) => t.date === todayDate);

    if (existingEntry) {
      if (existingEntry.status === "completed") {
        return res.status(400).json({
          message: "This habit is already marked as completed for today",
        });
      }
      existingEntry.status = "completed";
      existingEntry.completedAt = new Date();
    } else {
      habit.tracking.push({
        date: todayDate,
        status: "completed",
        completedAt: new Date(),
      });
    }

    await habit.save();

    res.json({
      success: true,
      message: "Habit marked as complete",
      data: habit,
    });
  } catch (err) {
    console.error("Error completing habit:", err);
    res.status(500).json({ message: "Failed to complete habit" });
  }
};

// ─── Reset Habit ────────────────────────────────────────────────────────────
exports.resetHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    habit.tracking = [];
    await habit.save();

    res.json({
      success: true,
      message: "Habit tracking reset",
      data: habit,
    });
  } catch (err) {
    console.error("Error resetting habit:", err);
    res.status(500).json({ message: "Failed to reset habit" });
  }
};

// ─── Link Habit to Goal ──────────────────────────────────────────────────────
exports.linkHabitToGoal = async (req, res) => {
  try {
    const { goalId } = req.body;

    if (!goalId) {
      return res.status(400).json({ message: "Goal ID is required" });
    }

    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const goal = await Goal.findOne({
      _id: goalId,
      userId: req.user._id,
      status: "active",
    });

    if (!goal) {
      return res.status(404).json({ message: "Active goal not found" });
    }

    habit.linkedGoal = goalId;
    await habit.save();

    res.json({
      success: true,
      message: "Habit linked to goal",
      data: habit,
    });
  } catch (err) {
    console.error("Error linking habit:", err);
    res.status(500).json({ message: "Failed to link habit" });
  }
};

// ─── Unlink Habit from Goal ─────────────────────────────────────────────────
exports.unlinkHabitFromGoal = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    if (!habit.linkedGoal) {
      return res.status(400).json({
        message: "This habit is not linked to any goal",
      });
    }

    habit.linkedGoal = null;
    await habit.save();

    res.json({
      success: true,
      message: "Habit unlinked from goal",
      data: habit,
    });
  } catch (err) {
    console.error("Error unlinking habit:", err);
    res.status(500).json({ message: "Failed to unlink habit" });
  }
};

// ─── Delete Habit ───────────────────────────────────────────────────────────
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    res.json({
      success: true,
      message: "Habit deleted",
    });
  } catch (err) {
    console.error("Error deleting habit:", err);
    res.status(500).json({ message: "Failed to delete habit" });
  }
};

module.exports = exports;
