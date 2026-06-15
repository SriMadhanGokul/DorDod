// backend/controllers/metricsController.js
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const Reflection = require("../models/Reflection");
const DailyMetrics = require("../models/DailyMetrics");
const AlignmentTrend = require("../models/AlignmentTrend");
const Growth = require("../models/Growth");

// ============================================
// UTILITY FUNCTIONS
// ============================================
const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getAlignmentLevel = (score) => {
  if (score >= 80) return "Aligned";
  if (score >= 60) return "Moderately Aligned";
  if (score >= 40) return "Partially Aligned";
  return "Misaligned";
};

// ============================================
// CALCULATE ALIGNMENT SCORE (MAIN FUNCTION)
// ============================================
exports.calculateAlignmentScore = async (userId, date = new Date()) => {
  try {
    const day = startOfDay(date);

    // 1. Get all active goals
    const allGoals = await Goal.find({ userId, status: "Active" });

    if (allGoals.length === 0) {
      return {
        success: true,
        alignmentScore: 0,
        components: { goalProgress: 0, habitCompletion: 0, reflection: 0 },
      };
    }

    // 2. Count goals completed today
    const goalsCompletedToday = allGoals.filter((g) =>
      g.completedAt ? isSameDay(g.completedAt, day) : false,
    ).length;

    const goalProgress = (goalsCompletedToday / allGoals.length) * 70;

    // 3. Get all goal-linked habits
    const goalLinkedHabits = await Habit.find({
      userId,
      linkedGoal: { $ne: null },
      status: "Active",
    });

    let habitCompletion = 0;
    let habitsCompletedToday = 0;

    if (goalLinkedHabits.length > 0) {
      // 4. Count goal-linked habits completed today
      habitsCompletedToday = goalLinkedHabits.filter((h) =>
        h.completedOn ? isSameDay(h.completedOn, day) : false,
      ).length;

      habitCompletion = (habitsCompletedToday / goalLinkedHabits.length) * 20;
    }

    // 5. Check if reflection done today
    const reflection = await Reflection.findOne({
      userId,
      createdAt: {
        $gte: day,
        $lte: endOfDay(date),
      },
    });

    const reflectionScore = reflection ? 10 : 0;

    // 6. Calculate final alignment score
    const alignmentScore = Math.round(
      goalProgress + habitCompletion + reflectionScore,
    );

    // 7. Calculate risk indicator
    const { riskPoints, riskLevel, details } = await calculateRisk(
      userId,
      date,
      allGoals,
      goalLinkedHabits,
      reflection,
    );

    // 8. Save daily metrics
    const metrics = await DailyMetrics.findOneAndUpdate(
      { userId, date: day },
      {
        userId,
        date: day,
        goalProgress: Math.round(goalProgress),
        habitCompletion: Math.round(habitCompletion),
        reflectionDone: !!reflection,
        alignmentScore,
        riskIndicator: riskPoints,
        riskLevel,
        riskDetails: details,
        goalsCompletedCount: goalsCompletedToday,
        activeGoalsCount: allGoals.length,
        habitsCompletedCount: habitsCompletedToday,
        plannedHabitsCount: goalLinkedHabits.length,
      },
      { upsert: true, new: true },
    );

    return {
      success: true,
      alignmentScore,
      level: getAlignmentLevel(alignmentScore),
      components: {
        goalProgress: Math.round(goalProgress),
        habitCompletion: Math.round(habitCompletion),
        reflection: reflectionScore,
      },
      riskIndicator: {
        points: riskPoints,
        level: riskLevel,
        details,
      },
    };
  } catch (err) {
    console.error("Error calculating alignment score:", err);
    return { success: false, error: err.message };
  }
};

// ============================================
// CALCULATE RISK INDICATOR
// ============================================
async function calculateRisk(
  userId,
  date,
  allGoals,
  goalLinkedHabits,
  reflection,
) {
  let riskPoints = 0;
  const details = {
    missedGoals: 0,
    missedReflections: 0,
    missedHabits: 0,
    consecutiveMisses: 0,
  };

  const day = startOfDay(date);

  // 1. Count missed goals
  const missedGoals = allGoals.filter((g) => {
    if (!g.completedAt) return true;
    return !isSameDay(g.completedAt, day);
  }).length;

  riskPoints += missedGoals * 10;
  details.missedGoals = missedGoals;

  // 2. Check missed reflection
  if (!reflection) {
    riskPoints += 5;
    details.missedReflections = 1;
  }

  // 3. Count missed habits
  const missedHabits = goalLinkedHabits.filter((h) => {
    if (!h.completedOn) return true;
    return !isSameDay(h.completedOn, day);
  }).length;

  riskPoints += missedHabits * 2;
  details.missedHabits = missedHabits;

  // 4. Check consecutive misses
  const lastThreeDays = await DailyMetrics.find({
    userId,
    date: {
      $gte: addDays(day, -3),
      $lte: endOfDay(date),
    },
  }).sort({ date: -1 });

  let consecutiveLowScores = 0;
  for (const metric of lastThreeDays) {
    if (metric.alignmentScore < 50) {
      consecutiveLowScores++;
    } else {
      break;
    }
  }

  if (consecutiveLowScores >= 2) {
    riskPoints += 10;
    details.consecutiveMisses = consecutiveLowScores;
  }

  // Determine risk level
  let riskLevel = "Low Risk";
  if (riskPoints > 25) riskLevel = "High Risk";
  else if (riskPoints > 10) riskLevel = "Medium Risk";

  return { riskPoints, riskLevel, details };
}

// ============================================
// CALCULATE ALIGNMENT TREND (30-Day Average)
// ============================================
exports.calculateAlignmentTrend = async (userId, date = new Date()) => {
  try {
    const day = startOfDay(date);
    const thirtyDaysAgo = addDays(day, -30);

    // Get metrics for last 30 days
    const metrics = await DailyMetrics.find({
      userId,
      date: {
        $gte: thirtyDaysAgo,
        $lte: endOfDay(date),
      },
    }).sort({ date: 1 });

    if (metrics.length === 0) {
      return {
        success: true,
        thirtyDayAverage: 0,
        sevenDayAverage: 0,
        trend: [],
      };
    }

    // Calculate 30-day average
    const totalScore = metrics.reduce((sum, m) => sum + m.alignmentScore, 0);
    const thirtyDayAverage = Math.round(totalScore / metrics.length);

    // Calculate 7-day average
    const sevenDaysAgo = addDays(day, -7);
    const recentMetrics = metrics.filter(
      (m) => m.date >= sevenDaysAgo && m.date <= endOfDay(date),
    );

    let sevenDayAverage = 0;
    if (recentMetrics.length > 0) {
      const recentTotal = recentMetrics.reduce(
        (sum, m) => sum + m.alignmentScore,
        0,
      );
      sevenDayAverage = Math.round(recentTotal / recentMetrics.length);
    }

    // Save alignment trend
    await AlignmentTrend.create({
      userId,
      date: day,
      dailyScore: metrics[metrics.length - 1]?.alignmentScore || 0,
      thirtyDayAverage,
      sevenDayAverage,
    });

    return {
      success: true,
      thirtyDayAverage,
      sevenDayAverage,
      totalDaysTracked: metrics.length,
      trend: metrics.map((m) => ({
        date: m.date,
        score: m.alignmentScore,
      })),
    };
  } catch (err) {
    console.error("Error calculating alignment trend:", err);
    return { success: false, error: err.message };
  }
};

// ============================================
// CALCULATE GROWTH SCORE
// ============================================
exports.calculateGrowthScore = async (userId) => {
  try {
    let growth = await Growth.findOne({ userId });

    if (!growth) {
      growth = new Growth({ userId });
    }

    // Calculate capabilities score (0-50)
    const capabilitiesCount =
      (growth.capabilities.skills?.length || 0) +
      (growth.capabilities.certifications?.length || 0) +
      (growth.capabilities.education?.length || 0) +
      (growth.capabilities.languages?.length || 0) +
      (growth.capabilities.experience?.length || 0);

    const capabilitiesScore = Math.min(capabilitiesCount * 5, 50);

    // Calculate achievements score (0-50)
    const achievementPoints =
      (growth.achievements.goalsCompleted || 0) * 5 +
      (growth.achievements.projectsCompleted || 0) * 5 +
      (growth.achievements.coursesFinished || 0) * 5 +
      (growth.achievements.milestonesReached || 0) * 5 +
      (growth.achievements.awards?.length || 0) * 5;

    const achievementsScore = Math.min(achievementPoints, 50);

    // Calculate total growth score
    const growthScore = Math.round(capabilitiesScore + achievementsScore);

    // Update growth record
    growth.capabilitiesScore = Math.round(capabilitiesScore);
    growth.achievementsScore = Math.round(achievementsScore);
    growth.growthScore = growthScore;
    growth.lastUpdated = new Date();

    await growth.save();

    return {
      success: true,
      growthScore,
      capabilitiesScore: Math.round(capabilitiesScore),
      achievementsScore: Math.round(achievementsScore),
    };
  } catch (err) {
    console.error("Error calculating growth score:", err);
    return { success: false, error: err.message };
  }
};

// ============================================
// API ENDPOINTS
// ============================================

// GET daily metrics
exports.getDailyMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date = new Date() } = req.query;

    const day = startOfDay(new Date(date));
    const metrics = await DailyMetrics.findOne({ userId, date: day });

    if (!metrics) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET alignment trend
exports.getAlignmentTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const daysAgo = addDays(new Date(), -days);

    const trend = await AlignmentTrend.find({
      userId,
      date: { $gte: daysAgo },
    }).sort({ date: 1 });

    const thirtyDayAverage =
      trend.length > 0
        ? Math.round(
            trend.reduce((sum, t) => sum + (t.dailyScore || 0), 0) /
              trend.length,
          )
        : 0;

    return res.json({
      success: true,
      data: {
        thirtyDayAverage,
        trend: trend.map((t) => ({
          date: t.date,
          score: t.thirtyDayAverage || 0,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET growth score
exports.getGrowthScore = async (req, res) => {
  try {
    const userId = req.user.id;

    const growth = await Growth.findOne({ userId });

    if (!growth) {
      return res.json({
        success: true,
        data: {
          growthScore: 0,
          capabilitiesScore: 0,
          achievementsScore: 0,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        growthScore: growth.growthScore,
        capabilitiesScore: growth.capabilitiesScore,
        achievementsScore: growth.achievementsScore,
        capabilities: growth.capabilities,
        achievements: growth.achievements,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET all dashboard metrics (combined)
exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = startOfDay(new Date());

    // Get today's alignment
    const todayMetrics = await DailyMetrics.findOne({
      userId,
      date: today,
    });

    // Get 30-day trend
    const thirtyDaysAgo = addDays(today, -30);
    const trends = await AlignmentTrend.find({
      userId,
      date: { $gte: thirtyDaysAgo, $lte: endOfDay(new Date()) },
    }).sort({ date: 1 });

    const thirtyDayAverage =
      trends.length > 0
        ? Math.round(
            trends.reduce((sum, t) => sum + (t.thirtyDayAverage || 0), 0) /
              trends.length,
          )
        : 0;

    // Get growth score
    const growth = await Growth.findOne({ userId });

    // Get goals and habits
    const goals = await Goal.find({ userId, status: "Active" });
    const habits = await Habit.find({
      userId,
      linkedGoal: { $ne: null },
      status: "Active",
    });

    return res.json({
      success: true,
      data: {
        alignmentScore: {
          today: todayMetrics?.alignmentScore || 0,
          components: {
            goalProgress: todayMetrics?.goalProgress || 0,
            habitCompletion: todayMetrics?.habitCompletion || 0,
            reflection: todayMetrics?.reflectionDone ? 10 : 0,
          },
          level: getAlignmentLevel(todayMetrics?.alignmentScore || 0),
        },
        alignmentTrend: {
          thirtyDayAverage,
          trend: trends.map((t) => ({
            date: t.date,
            score: t.thirtyDayAverage || 0,
          })),
        },
        growthScore: {
          overall: growth?.growthScore || 0,
          capabilities: growth?.capabilitiesScore || 0,
          achievements: growth?.achievementsScore || 0,
        },
        riskIndicator: {
          points: todayMetrics?.riskIndicator || 0,
          level: todayMetrics?.riskLevel || "Low Risk",
          details: todayMetrics?.riskDetails || {},
        },
        summary: {
          goalsActive: goals.length,
          habitsActive: habits.length,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
