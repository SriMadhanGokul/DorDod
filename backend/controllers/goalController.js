const Goal = require("../models/Goal");

const MAX_IN_PROGRESS = 3;

// Generate 21-day activity plan starting from today
const generate21DayPlan = (goalTitle, startDate = new Date()) => {
  const activities = [];
  for (let i = 1; i <= 21; i++) {
    const due = new Date(startDate);
    due.setDate(due.getDate() + (i - 1));
    activities.push({
      dayNumber: i,
      title: goalTitle,
      description: "",
      dueDate: due,
      status: "Upcoming",
    });
  }
  return activities;
};

// Auto-mark past days as Missed (called when goal is loaded)
const autoMarkMissedDays = async (goal) => {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  for (const day of goal.dayActivities) {
    const dueDay = day.dueDate?.toISOString?.()?.slice(0, 10);
    if (dueDay && dueDay < today && day.status === "Upcoming") {
      day.status = "Missed";
      changed = true;
    }
  }
  if (changed) {
    goal.markModified("dayActivities");
    await goal.save();
  }
  return goal;
};

// GET /api/goals
const getGoals = async (req, res) => {
  try {
    let goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    // Auto-mark any past days as Missed for in-progress goals
    for (const goal of goals.filter((g) => g.status === "In Progress")) {
      await autoMarkMissedDays(goal);
    }
    goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    const inProgress = goals.filter((g) => g.status === "In Progress");
    const backlog = goals.filter((g) => g.status === "Not Started");
    const completed = goals.filter((g) => g.status === "Completed");
    const onHold = goals.filter((g) => g.status === "On Hold");
    res.status(200).json({
      success: true,
      data: goals,
      meta: {
        inProgressCount: inProgress.length,
        backlogCount: backlog.length,
        completedCount: completed.length,
        onHoldCount: onHold.length,
        canActivate: MAX_IN_PROGRESS - inProgress.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch goals" });
  }
};

// POST /api/goals
const createGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      goalType,
      priority,
      startDate,
      expectedEndDate,
      measurementCriteria,
      coach,
      icon,
      color,
    } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "Category is required" });
    if (!measurementCriteria?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Measurement criteria is required" });

    // New goals always go to Backlog (Not Started)
    const goal = await Goal.create({
      user: req.user.id,
      title,
      description: description || "",
      category,
      goalType: goalType || "Personal",
      priority: priority || "Medium",
      status: "Not Started",
      progress: 0,
      startDate: startDate || null,
      expectedEndDate: expectedEndDate || null,
      measurementCriteria: measurementCriteria || "",
      coach: coach || "",
      icon: icon || "🎯",
      color: color || "#6366f1",
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Goal created and added to Backlog!",
        data: goal,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to create goal",
      });
  }
};

// PATCH /api/goals/:id/activate — Move from Backlog → In Progress
const activateGoal = async (req, res) => {
  try {
    // Check limit
    const inProgressCount = await Goal.countDocuments({
      user: req.user.id,
      status: "In Progress",
    });
    if (inProgressCount >= MAX_IN_PROGRESS) {
      return res
        .status(400)
        .json({
          success: false,
          message: `You can only have ${MAX_IN_PROGRESS} goals In Progress. Complete or pause one first.`,
        });
    }
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    if (goal.status === "In Progress")
      return res
        .status(400)
        .json({ success: false, message: "Goal is already In Progress" });

    goal.status = "In Progress";
    goal.planStartDate = new Date();
    goal.dayActivities = generate21DayPlan(goal.title, new Date());
    await goal.save();
    res
      .status(200)
      .json({
        success: true,
        message: `"${goal.title}" is now active! 21-day plan created.`,
        data: goal,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to activate goal" });
  }
};

// PATCH /api/goals/:id/deactivate — Move back to Backlog
const deactivateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: "Not Started" },
      { new: true },
    );
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    res
      .status(200)
      .json({ success: true, message: "Goal moved to Backlog", data: goal });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to deactivate goal" });
  }
};

// PATCH /api/goals/:id/day/:dayNumber/complete — Mark a day activity complete/incomplete
const completeDayActivity = async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    if (goal.status !== "In Progress")
      return res
        .status(400)
        .json({ success: false, message: "Goal is not In Progress" });

    const day = goal.dayActivities.find(
      (d) => d.dayNumber === parseInt(dayNumber),
    );
    if (!day)
      return res.status(404).json({ success: false, message: "Day not found" });

    const today = new Date().toISOString().slice(0, 10);
    const dueDay = day.dueDate?.toISOString().slice(0, 10);
    const wasCompleted = day.status === "Completed";

    // ── ONE CLICK PER DAY ENFORCEMENT ────────────────────────────────────
    // Users can only complete today's activity (dueDate === today)
    // Cannot complete past days or future days
    if (!wasCompleted) {
      if (!dueDay)
        return res
          .status(400)
          .json({ success: false, message: "This day has no due date set" });
      if (dueDay !== today) {
        if (dueDay < today) {
          // Past day — mark as Missed (penalty applied), cannot be completed
          return res.status(400).json({
            success: false,
            message: `Day ${dayNumber} was due on ${dueDay}. Missed days cannot be completed. A penalty has been applied.`,
            missed: true,
          });
        } else {
          // Future day — not allowed
          return res.status(400).json({
            success: false,
            message: `Day ${dayNumber} is scheduled for ${dueDay}. You can only complete today's activity.`,
          });
        }
      }
    }

    if (wasCompleted) {
      // Allow un-completing only if it was done today
      const completedToday = day.completedAt
        ? new Date(day.completedAt).toISOString().slice(0, 10) === today
        : false;
      if (!completedToday) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Cannot undo a previously completed day.",
          });
      }
      day.status = "Upcoming";
      day.completedAt = null;
    } else {
      day.status = "Completed";
      day.completedAt = new Date();
    }

    // Recalculate progress
    const completedCount = goal.dayActivities.filter(
      (d) => d.status === "Completed",
    ).length;
    goal.progress = Math.round((completedCount / 21) * 100);
    if (goal.progress === 100) goal.status = "Completed";

    goal.markModified("dayActivities");
    await goal.save();

    // Award XP if just completed
    if (!wasCompleted) {
      try {
        const { awardXP } = require("./xpController");
        await awardXP(req.user.id, "activity_done");
      } catch {}
    }

    res
      .status(200)
      .json({
        success: true,
        message: wasCompleted ? "Day unmarked" : "✅ Day completed!",
        data: goal,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update day" });
  }
};

// PUT /api/goals/:id
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    if (goal.status === "Completed")
      return res
        .status(400)
        .json({
          success: false,
          message: "🔒 Completed goals cannot be edited",
        });

    const allowed = [
      "title",
      "description",
      "priority",
      "category",
      "goalType",
      "startDate",
      "expectedEndDate",
      "measurementCriteria",
      "coach",
      "icon",
      "color",
      "tags",
    ];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) goal[k] = req.body[k];
    });

    if (req.body.status === "Completed") {
      goal.status = "Completed";
      goal.progress = 100;
      try {
        const { awardXP } = require("./xpController");
        await awardXP(req.user.id, "goal_complete");
      } catch {}
    }

    await goal.save();
    res
      .status(200)
      .json({ success: true, message: "Goal updated!", data: goal });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update goal" });
  }
};

// DELETE /api/goals/:id
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    if (goal.status === "Completed")
      return res
        .status(400)
        .json({
          success: false,
          message: "🔒 Completed goals cannot be deleted",
        });
    await Goal.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Goal deleted!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete goal" });
  }
};

// PATCH /api/goals/:id/day/:dayNumber/pause
const pauseDay = async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    if (goal.status !== "In Progress")
      return res
        .status(400)
        .json({ success: false, message: "Goal is not active" });
    if (goal.pausedDays >= goal.maxPauseDays)
      return res
        .status(400)
        .json({
          success: false,
          message: `Max ${goal.maxPauseDays} pause days allowed per plan`,
        });

    const day = goal.dayActivities.find(
      (d) => d.dayNumber === parseInt(dayNumber),
    );
    if (!day)
      return res.status(404).json({ success: false, message: "Day not found" });
    if (day.status === "Completed")
      return res
        .status(400)
        .json({ success: false, message: "Cannot pause a completed day" });

    day.status = "Paused";
    day.isPaused = true;
    goal.pausedDays += 1;

    // Extend plan — push all remaining due dates by 1 day
    const dueDate = day.dueDate ? new Date(day.dueDate) : new Date();
    goal.dayActivities.forEach((d) => {
      if (d.dayNumber > parseInt(dayNumber) && d.dueDate) {
        const newDue = new Date(d.dueDate);
        newDue.setDate(newDue.getDate() + 1);
        d.dueDate = newDue;
      }
    });

    goal.markModified("dayActivities");
    await goal.save();
    res
      .status(200)
      .json({
        success: true,
        message: `Day ${dayNumber} paused. Plan extended by 1 day.`,
        data: goal,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to pause day" });
  }
};

module.exports = {
  getGoals,
  createGoal,
  activateGoal,
  deactivateGoal,
  completeDayActivity,
  updateGoal,
  deleteGoal,
  pauseDay,
};
