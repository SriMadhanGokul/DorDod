const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const DailyCheckIn = require("../models/DailyCheckIn");
const DailyReflection = require("../models/DailyReflection");

// ─── Get Dashboard Metrics ───────────────────────────────────────────────────
exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    // Fetch all required data in parallel
    const [goals, habits, checkInToday, reflections] = await Promise.all([
      Goal.find({ userId }).lean(),
      Habit.find({ userId }).lean(),
      DailyCheckIn.findOne({ userId, date: today }).lean(),
      DailyReflection.find({ userId }).lean(),
    ]);

    // Calculate Goal Metrics
    const activeGoals = goals.filter((g) => g.status === "active").length;
    const completedGoals = goals.filter((g) => g.status === "completed").length;
    const totalGoals = goals.length;

    // Calculate average goal progress (alignment score)
    const avgGoalProgress =
      goals.length > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length,
          )
        : 0;

    // Calculate alignment trend (30-day rolling average)
    const alignmentTrend = Math.round(avgGoalProgress * 0.85);

    // Calculate Habit Metrics
    const totalHabits = habits.length;
    const linkedHabits = habits.filter((h) => h.linkedGoal).length;

    // Calculate today's completed habits
    const completedHabitsToday = habits.filter((h) => {
      return h.tracking?.some(
        (t) => t.date === today && t.status === "completed",
      );
    }).length;

    // Calculate habit completion rate (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    let totalHabitCompletions = 0;
    let totalHabitOpportunities = 0;

    habits.forEach((habit) => {
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split("T")[0];
        totalHabitOpportunities++;

        const tracked = habit.tracking?.find((t) => t.date === dateStr);
        if (tracked?.status === "completed") {
          totalHabitCompletions++;
        }
      }
    });

    const habitCompletionRate =
      totalHabitOpportunities > 0
        ? Math.round((totalHabitCompletions / totalHabitOpportunities) * 100)
        : 0;

    // Calculate Growth Score (achievements + capabilities)
    // For now, estimate based on completed goals and habits
    const growthScore = completedGoals * 10 + completedHabitsToday * 5;

    // Calculate Risk Indicator
    // High risk if no active goals or no habit completions
    let riskIndicator = 50; // baseline
    if (activeGoals === 0) riskIndicator += 25;
    if (completedHabitsToday === 0 && totalHabits > 0) riskIndicator += 20;
    if (avgGoalProgress < 30) riskIndicator += 15;
    riskIndicator = Math.min(riskIndicator, 100);

    // Get today's reflection count
    const todayReflections = reflections.filter((r) => r.date === today).length;

    // Calculate Score Breakdown
    const goalProgress = {
      completed: completedGoals,
      total: totalGoals,
    };

    const habitCompletion = {
      completed: completedHabitsToday,
      total: totalHabits,
    };

    // Estimate Capabilities & Achievements (can be extended with actual models)
    const capabilities = {
      completed: Math.floor(avgGoalProgress / 20), // Rough estimate
      total: Math.max(5, totalGoals * 2), // Expected total
    };

    const achievements = {
      completed: completedGoals,
      total: Math.max(5, totalGoals),
    };

    // Check if user checked in today
    const hasCheckedInToday = !!checkInToday;

    // Check if user reflected today
    const hasReflectedToday = todayReflections > 0;

    res.json({
      success: true,
      data: {
        alignmentScore: avgGoalProgress,
        alignmentTrend,
        growthScore,
        riskIndicator,
        goalProgress,
        habitCompletion,
        habitCompletionRate,
        reflectionCount: todayReflections,
        capabilities,
        achievements,
        stats: {
          activeGoals,
          completedGoals,
          totalGoals,
          linkedHabits,
          totalHabits,
          completedHabitsToday,
        },
        checks: {
          hasCheckedInToday,
          hasReflectedToday,
        },
      },
    });
  } catch (err) {
    console.error("Error getting dashboard metrics:", err);
    res.status(500).json({ message: "Failed to get dashboard metrics" });
  }
};

// ─── Get Quick Stats ────────────────────────────────────────────────────────
exports.getQuickStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [goals, habits] = await Promise.all([
      Goal.find({ userId }).lean(),
      Habit.find({ userId }).lean(),
    ]);

    const today = new Date().toISOString().split("T")[0];

    res.json({
      success: true,
      data: {
        activeGoals: goals.filter((g) => g.status === "active").length,
        completedGoals: goals.filter((g) => g.status === "completed").length,
        totalGoals: goals.length,
        totalHabits: habits.length,
        linkedHabits: habits.filter((h) => h.linkedGoal).length,
        completedHabitsToday: habits.filter((h) =>
          h.tracking?.some((t) => t.date === today && t.status === "completed"),
        ).length,
        avgProgress:
          goals.length > 0
            ? Math.round(
                goals.reduce((sum, g) => sum + (g.progress || 0), 0) /
                  goals.length,
              )
            : 0,
      },
    });
  } catch (err) {
    console.error("Error getting quick stats:", err);
    res.status(500).json({ message: "Failed to get quick stats" });
  }
};

module.exports = exports;
