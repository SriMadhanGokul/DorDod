const Goal = require("../models/Goal");

// ✅ GET all goals for user
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    console.error("getGoals error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch goals" });
  }
};

// ✅ GET goals by status
exports.getGoalsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch goals" });
  }
};

// ✅ GET single goal
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch goal" });
  }
};

// ✅ CREATE goal
exports.createGoal = async (req, res) => {
  try {
    const { title, description, category, priority, duration } = req.body;

    // Validation - ALL FIELDS REQUIRED
    if (!title || !description || !category || !priority || !duration) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (duration < 21 || duration > 50) {
      return res.status(400).json({
        success: false,
        message: "Duration must be between 21 and 50 days",
      });
    }

    // Calculate target date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + duration);

    const goal = await Goal.create({
      userId: req.user.id,
      title,
      description,
      category,
      priority,
      duration,
      targetDate,
      status: "archived",
      progress: 0,
      dayCompletion: new Map(), // ✅ Initialize empty day tracking
    });

    res.status(201).json({
      success: true,
      message: "Goal created!",
      data: goal,
    });
  } catch (error) {
    console.error("createGoal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create goal",
      error: error.message,
    });
  }
};

// ✅ UPDATE goal
exports.updateGoal = async (req, res) => {
  try {
    let goal = await Goal.findById(req.params.goalId);
    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    if (req.body.duration) {
      if (req.body.duration < 21 || req.body.duration > 50) {
        return res.status(400).json({
          success: false,
          message: "Duration must be between 21 and 50 days",
        });
      }
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + req.body.duration);
      req.body.targetDate = targetDate;
    }

    goal = await Goal.findByIdAndUpdate(req.params.goalId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Goal updated",
      data: goal,
    });
  } catch (error) {
    console.error("updateGoal error:", error);
    res.status(500).json({ success: false, message: "Failed to update goal" });
  }
};

// ✅ DELETE goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    await Goal.findByIdAndDelete(req.params.goalId);

    res
      .status(200)
      .json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete goal" });
  }
};

// ✅ COMPLETE goal
exports.completeGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    goal.status = "completed";
    goal.progress = 100;
    goal.completedAt = new Date();
    await goal.save();

    res.status(200).json({
      success: true,
      message: "🎉 Congratulations! Goal completed!",
      data: goal,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to complete goal" });
  }
};

// ✅ PAUSE goal
exports.pauseGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    goal.status = "paused";
    await goal.save();

    res.status(200).json({
      success: true,
      message: "Goal paused",
      data: goal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to pause goal" });
  }
};

// ✅ RESUME goal
exports.resumeGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    goal.status = "active";
    await goal.save();

    res.status(200).json({
      success: true,
      message: "Goal resumed",
      data: goal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to resume goal" });
  }
};

// ✅ ACTIVATE goal
exports.activateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    // Check max 3 active goals
    const activeCount = await Goal.countDocuments({
      userId: req.user.id,
      status: "active",
    });

    if (activeCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "You can only have 3 active goals at a time",
      });
    }

    goal.status = "active";
    await goal.save();

    res.status(200).json({
      success: true,
      message: "Goal activated! Start tracking on Execution page.",
      data: goal,
    });
  } catch (error) {
    console.error("activateGoal error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to activate goal" });
  }
};

// ✅ COMPLETE goal by day (SAVES INDIVIDUAL DAY DATA)
exports.completeGoalByDay = async (req, res) => {
  try {
    const { goalId, dayNumber } = req.params;
    const goal = await Goal.findById(goalId);

    if (!goal || goal.userId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    // ✅ SAVE individual day completion
    if (!goal.dayCompletion) {
      goal.dayCompletion = new Map();
    }

    goal.dayCompletion.set(String(dayNumber), {
      dayNumber: parseInt(dayNumber),
      completedAt: new Date(),
      status: "completed",
    });

    // Calculate progress based on completed days
    const completedDays = Array.from(goal.dayCompletion.values()).filter(
      (d) => d.status === "completed",
    ).length;
    const newProgress = Math.round(
      (completedDays / (goal.duration || 21)) * 100,
    );
    goal.progress = newProgress;

    // If all days completed, mark goal as completed
    if (completedDays >= (goal.duration || 21)) {
      goal.status = "completed";
      goal.progress = 100;
      goal.completedAt = new Date();
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: `✅ Day ${dayNumber} marked complete!`,
      data: goal,
    });
  } catch (error) {
    console.error("completeGoalByDay error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark day complete",
    });
  }
};

// ✅ GET goal stats
exports.getGoalStats = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });

    const total = goals.length;
    const active = goals.filter((g) => g.status === "active").length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const paused = goals.filter((g) => g.status === "paused").length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        completed,
        paused,
        completionRate,
      },
    });
  } catch (error) {
    console.error("getGoalStats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};
