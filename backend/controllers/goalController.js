const Goal = require("../models/Goal");

const fixDayCompletion = (goal) => {
  if (!goal.dayCompletion) goal.dayCompletion = {};
  if (goal.dayCompletion instanceof Map) {
    goal.dayCompletion = Object.fromEntries(goal.dayCompletion);
  }
  return goal;
};

// ✅ COUNT ONLY REAL DATES (filter out Mongoose properties)
const getCompletedCount = (dayCompletion) => {
  return Object.keys(dayCompletion).filter((key) => !key.startsWith("$"))
    .length;
};

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    goals.forEach(fixDayCompletion);
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { title, description, deadline, category, priority, duration } =
      req.body;
    const goal = await Goal.create({
      userId: req.user.id,
      title,
      description,
      deadline,
      category,
      priority,
      duration: duration || 21,
      status: "archived",
      progress: 0,
      dayCompletion: {},
    });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markDayComplete = async (req, res) => {
  try {
    const goalId = req.params.id;
    const dayNumber = parseInt(req.params.day);

    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    fixDayCompletion(goal);

    const today = new Date().toISOString().split("T")[0];

    const createdDate = new Date(goal.createdAt);
    const createdUTC = new Date(
      Date.UTC(
        createdDate.getUTCFullYear(),
        createdDate.getUTCMonth(),
        createdDate.getUTCDate(),
      ),
    );

    const targetDate = new Date(createdUTC);
    targetDate.setUTCDate(targetDate.getUTCDate() + dayNumber - 1);
    const completionDate = targetDate.toISOString().split("T")[0];

    if (completionDate > today) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark future dates`,
      });
    }

    if (goal.dayCompletion[completionDate]) {
      return res.status(200).json({
        success: true,
        message: "Already completed",
        data: goal,
      });
    }

    // Mark only this one date
    goal.dayCompletion[completionDate] = {
      date: completionDate,
      dayNumber: dayNumber,
      completedAt: new Date().toISOString(),
      status: "completed",
    };

    // ✅ COUNT ONLY REAL DATES (not Mongoose properties)
    const completedCount = getCompletedCount(goal.dayCompletion);
    goal.progress = Math.min(
      100,
      Math.round((completedCount / goal.duration) * 100),
    );

    console.log(
      `\n📊 Progress: ${completedCount}/${goal.duration} = ${goal.progress}%`,
    );

    // Auto-complete if done
    if (completedCount >= goal.duration) {
      goal.status = "completed";
      goal.completedAt = new Date();
      console.log(`🎉 GOAL COMPLETED`);
    }

    await goal.save();
    console.log(`✅ SAVED\n`);

    res.json({
      success: true,
      message: `Day ${dayNumber} marked!`,
      data: goal,
    });
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}\n`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markGoalIncomplete = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });

    fixDayCompletion(goal);
    const dateToRemove =
      req.body.date || new Date().toISOString().split("T")[0];

    if (goal.dayCompletion[dateToRemove]) {
      delete goal.dayCompletion[dateToRemove];
    }

    const completedCount = getCompletedCount(goal.dayCompletion);
    goal.progress = Math.round((completedCount / goal.duration) * 100);

    if (goal.status === "completed") {
      goal.status = "active";
      goal.completedAt = null;
    }

    await goal.save();
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.activateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true },
    );
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.pauseGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { status: "paused" },
      { new: true },
    );
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resumeGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true },
    );
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markGoalComplete = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });

    fixDayCompletion(goal);
    const today = new Date().toISOString().split("T")[0];

    if (goal.dayCompletion[today]) {
      return res.json({
        success: true,
        message: "Already done today",
        data: goal,
      });
    }

    goal.dayCompletion[today] = {
      date: today,
      completedAt: new Date().toISOString(),
      status: "completed",
    };

    const completedCount = getCompletedCount(goal.dayCompletion);
    goal.progress = Math.round((completedCount / goal.duration) * 100);

    if (completedCount >= goal.duration) {
      goal.status = "completed";
      goal.completedAt = new Date();
    }

    await goal.save();
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGoalStats = async (req, res) => {
  try {
    const total = await Goal.countDocuments({ userId: req.user.id });
    const completed = await Goal.countDocuments({
      userId: req.user.id,
      status: "completed",
    });
    const active = await Goal.countDocuments({
      userId: req.user.id,
      status: "active",
    });
    const paused = await Goal.countDocuments({
      userId: req.user.id,
      status: "paused",
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        completed,
        paused,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
