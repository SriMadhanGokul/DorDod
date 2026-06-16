const Habit = require("../models/Habit");

// ✅ Helper: Check time overlap
const checkTimeOverlap = (
  newStart,
  newEnd,
  existingHabits,
  excludeId = null,
) => {
  if (!newStart || !newEnd) return null;

  const [startHour, startMin] = newStart.split(":").map(Number);
  const [endHour, endMin] = newEnd.split(":").map(Number);
  const newStartMin = startHour * 60 + startMin;
  const newEndMin = endHour * 60 + endMin;

  const habitsToCheck = existingHabits.filter(
    (h) => h._id.toString() !== excludeId,
  );

  for (const existing of habitsToCheck) {
    if (!existing.timeStart || !existing.timeEnd) continue;

    const [eStartHour, eStartMin] = existing.timeStart.split(":").map(Number);
    const [eEndHour, eEndMin] = existing.timeEnd.split(":").map(Number);
    const existingStartMin = eStartHour * 60 + eStartMin;
    const existingEndMin = eEndHour * 60 + eEndMin;

    if (
      (newStartMin < existingEndMin && newEndMin > existingStartMin) ||
      (newStartMin === existingStartMin && newEndMin === existingEndMin)
    ) {
      return {
        overlaps: true,
        conflictingHabit: existing.title,
        conflictTime: `${existing.timeStart} - ${existing.timeEnd}`,
      };
    }
  }

  return null;
};

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: habits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });
    }
    res.json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createHabit = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      frequency,
      timeStart,
      timeEnd,
      goalId,
    } = req.body;

    if (!title || !description || !timeStart || !timeEnd) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and times are required",
      });
    }

    if (!/^\d{2}:\d{2}$/.test(timeStart) || !/^\d{2}:\d{2}$/.test(timeEnd)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM",
      });
    }

    const [startHour, startMin] = timeStart.split(":").map(Number);
    const [endHour, endMin] = timeEnd.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const existingHabits = await Habit.find({ userId: req.user.id });
    const overlapCheck = checkTimeOverlap(timeStart, timeEnd, existingHabits);

    if (overlapCheck?.overlaps) {
      return res.status(400).json({
        success: false,
        message: `Time slot conflicts with "${overlapCheck.conflictingHabit}" (${overlapCheck.conflictTime})`,
      });
    }

    const habit = await Habit.create({
      userId: req.user.id,
      title,
      description,
      category,
      frequency,
      timeStart,
      timeEnd,
      linkedGoal: goalId || null,
      status: "Active",
      tracking: [],
    });

    console.log(`✅ Habit created: ${habit._id}`);
    console.log(`   Title: ${habit.title}`);
    console.log(`   Time: ${habit.timeStart} - ${habit.timeEnd}`);

    res.status(201).json({ success: true, data: habit });
  } catch (error) {
    console.error("Create habit error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateHabit = async (req, res) => {
  try {
    const { title, description, category, frequency, timeStart, timeEnd } =
      req.body;

    if (timeStart && timeEnd) {
      if (!/^\d{2}:\d{2}$/.test(timeStart) || !/^\d{2}:\d{2}$/.test(timeEnd)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format. Use HH:MM",
        });
      }

      const [startHour, startMin] = timeStart.split(":").map(Number);
      const [endHour, endMin] = timeEnd.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time",
        });
      }

      const existingHabits = await Habit.find({ userId: req.user.id });
      const overlapCheck = checkTimeOverlap(
        timeStart,
        timeEnd,
        existingHabits,
        req.params.id,
      );

      if (overlapCheck?.overlaps) {
        return res.status(400).json({
          success: false,
          message: `Time slot conflicts with "${overlapCheck.conflictingHabit}" (${overlapCheck.conflictTime})`,
        });
      }
    }

    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category,
        frequency,
        ...(timeStart && { timeStart }),
        ...(timeEnd && { timeEnd }),
      },
      { new: true },
    );

    console.log(`✅ Habit updated: ${habit._id}`);

    res.json({ success: true, data: habit });
  } catch (error) {
    console.error("Update habit error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    await Habit.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Habit deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Mark habit complete - Uses TRACKING field
exports.markHabitComplete = async (req, res) => {
  try {
    const habitId = req.params.id;
    const today = new Date().toISOString().split("T")[0];

    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });
    }

    // Initialize tracking if it doesn't exist
    if (!habit.tracking) {
      habit.tracking = [];
    }

    // Check if already completed today
    const todayTracking = habit.tracking.find((t) => {
      const trackDate = new Date(t.date).toISOString().split("T")[0];
      return trackDate === today;
    });

    if (todayTracking?.status === "completed") {
      return res.json({
        success: true,
        message: "Already completed today",
        data: habit,
      });
    }

    // Remove old record for today if exists
    habit.tracking = habit.tracking.filter((t) => {
      const trackDate = new Date(t.date).toISOString().split("T")[0];
      return trackDate !== today;
    });

    // Add new completed record
    habit.tracking.push({
      date: new Date(),
      status: "completed",
      completedAt: new Date(),
      markedAt: new Date(),
    });

    habit.status = "Active";

    await habit.save();

    console.log(`✅ Habit completed: ${habitId} on ${today}`);
    res.json({ success: true, message: "Habit marked complete!", data: habit });
  } catch (error) {
    console.error("Mark habit complete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark habit incomplete
exports.markHabitIncomplete = async (req, res) => {
  try {
    const habitId = req.params.id;
    const today = new Date().toISOString().split("T")[0];

    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });
    }

    if (habit.tracking) {
      habit.tracking = habit.tracking.filter((t) => {
        const trackDate = new Date(t.date).toISOString().split("T")[0];
        return trackDate !== today;
      });
    }

    await habit.save();
    res.json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Link habit to goal
exports.linkHabitToGoal = async (req, res) => {
  try {
    const { goalId } = req.body;
    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      { linkedGoal: goalId },
      { new: true },
    );
    res.json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unlink habit from goal
exports.unlinkHabitFromGoal = async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      { linkedGoal: null },
      { new: true },
    );
    res.json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
