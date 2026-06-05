const Routine = require("../models/Routine");
const Goal = require("../models/Goal");

// Calculate Growth Score
const getGrowthScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // ─── Get all goals for alignment score ───
    const goals = await Goal.find({ user: userId, status: "In Progress" });
    const totalGoals = goals.length;
    let totalDaysCompleted = 0;
    let totalDaysInPlan = 0;

    goals.forEach((goal) => {
      const completedDays =
        goal.dayActivities?.filter((d) => d.status === "Completed").length || 0;
      totalDaysCompleted += completedDays;
      totalDaysInPlan += 21;
    });

    const alignmentScore =
      totalGoals > 0
        ? Math.round((totalDaysCompleted / totalDaysInPlan) * 100)
        : 0;

    // ─── Get all routines (habits) for consistency score ───
    const routines = await Routine.find({ user: userId });
    const goalLinkedRoutines = routines.filter((r) => r.linkedGoal).length;

    // Calculate weekly completion
    let weeklyCompleted = 0;
    let weeklyScheduled = 0;

    routines.forEach((routine) => {
      if (routine.schedule && routine.schedule.length > 0) {
        routine.schedule.forEach((day) => {
          if (day.date >= weekStartStr) {
            weeklyScheduled += 1;
            if (day.completed) weeklyCompleted += 1;
          }
        });
      }
    });

    // Apply 1.5x weight to goal-linked habit completions
    let weightedCompleted = 0;
    let weightedScheduled = 0;

    routines.forEach((routine) => {
      if (routine.schedule && routine.schedule.length > 0) {
        const weight = routine.linkedGoal ? 1.5 : 1;
        routine.schedule.forEach((day) => {
          if (day.date >= weekStartStr) {
            weightedScheduled += weight;
            if (day.completed) weightedCompleted += weight;
          }
        });
      }
    });

    const habitConsistency =
      weightedScheduled > 0
        ? Math.round((weightedCompleted / weightedScheduled) * 100)
        : 0;

    // ─── Calculate unified growth score ───
    const growthScore = Math.round(
      alignmentScore * 0.6 + habitConsistency * 0.4,
    );

    // Determine level
    let level = "Starting";
    if (growthScore >= 80) level = "Excellent";
    else if (growthScore >= 60) level = "Good";
    else if (growthScore >= 40) level = "Fair";

    res.status(200).json({
      success: true,
      data: {
        growthScore,
        level,
        alignmentScore,
        habitConsistency,
        weeklyCompleted,
        weeklyScheduled,
        goalLinkedRoutines,
        totalRoutines: routines.length,
        inProgressGoals: totalGoals,
      },
    });
  } catch (e) {
    console.error("growthScore error:", e);
    res
      .status(500)
      .json({ success: false, message: "Failed to calculate growth score" });
  }
};

module.exports = { getGrowthScore };
