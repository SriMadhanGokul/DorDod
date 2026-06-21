const AlignmentScore = require("../models/AlignmentScore");
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const DailyCheckIn = require("../models/DailyCheckIn");

// Get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

// Get date N days ago in YYYY-MM-DD format
const getDateNDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

// ✅ CALCULATE DAILY ALIGNED SCORE (DAS)
// DAS = (33.33% Goal Completion) + (33.33% Habit Completion) + (33.33% CheckIn Score)
const calculateDAS = async (userId, dateString) => {
  try {
    // 1️⃣ GOAL COMPLETION PERCENT
    const activeGoals = await Goal.find({
      user: userId,
      status: "active",
    });

    let goalCompletionPercent = 0;
    if (activeGoals.length > 0) {
      const goalProgressSum = activeGoals.reduce(
        (sum, goal) => sum + (goal.progress || 0),
        0,
      );
      goalCompletionPercent = goalProgressSum / activeGoals.length; // 0-100
    }

    // 2️⃣ HABIT COMPLETION PERCENT
    const linkedHabits = await Habit.find({
      user: userId,
      linkedGoal: { $ne: null }, // Only goal-linked habits count
    });

    let habitCompletionPercent = 0;
    if (linkedHabits.length > 0) {
      const completedToday = linkedHabits.filter((habit) => {
        return (
          habit.tracking &&
          habit.tracking.some(
            (t) => t.date === dateString && t.status === "completed",
          )
        );
      }).length;
      habitCompletionPercent = (completedToday / linkedHabits.length) * 100; // 0-100
    }

    // 3️⃣ CHECK-IN SCORE
    const checkIn = await DailyCheckIn.findOne({
      user: userId,
      date: dateString,
    });

    let checkInScore = 0;
    if (checkIn && checkIn.mood) {
      // Map mood to score: very bad=0, bad=25, neutral=50, good=75, very good=100
      const moodScoreMap = {
        "very bad": 0,
        bad: 25,
        neutral: 50,
        good: 75,
        "very good": 100,
      };
      checkInScore = moodScoreMap[checkIn.mood.toLowerCase()] || 50;
    }

    // CALCULATE DAS: equal weight average
    const das =
      (goalCompletionPercent + habitCompletionPercent + checkInScore) / 3;

    return {
      dailyAlignedScore: Math.round(das),
      goalCompletionPercent: Math.round(goalCompletionPercent),
      habitCompletionPercent: Math.round(habitCompletionPercent),
      checkInScore: Math.round(checkInScore),
      isAboveThreshold: das >= 50,
    };
  } catch (error) {
    console.error("Error calculating DAS:", error);
    return {
      dailyAlignedScore: 0,
      goalCompletionPercent: 0,
      habitCompletionPercent: 0,
      checkInScore: 0,
      isAboveThreshold: false,
    };
  }
};

// ✅ CALCULATE ALIGNMENT TREND SCORE (ATS)
// ATS_today = (0.3 × DAS_today) + (0.7 × ATS_yesterday)
const calculateATS = async (userId, dateString, dasTodayValue) => {
  try {
    const yesterdayString = getDateNDaysAgo(1);

    // Get yesterday's ATS
    const yesterdayScore = await AlignmentScore.findOne({
      user: userId,
      date: yesterdayString,
    });

    const atsYesterday = yesterdayScore?.alignmentTrendScore || 0;

    // Calculate today's ATS
    const atsToday = 0.3 * dasTodayValue + 0.7 * atsYesterday;

    return Math.round(atsToday);
  } catch (error) {
    console.error("Error calculating ATS:", error);
    return 0;
  }
};

// ✅ CALCULATE CONSISTENCY
// Consistency = (Days DAS ≥ 50 / 30) × 100
const calculateConsistency = async (userId) => {
  try {
    const thirtyDaysAgo = getDateNDaysAgo(29); // 30 days including today
    const today = getTodayString();

    // Get all scores from last 30 days
    const scores = await AlignmentScore.find({
      user: userId,
      date: { $gte: thirtyDaysAgo, $lte: today },
    });

    const daysAboveThreshold = scores.filter(
      (score) => score.isAboveThreshold === true,
    ).length;

    const consistency = (daysAboveThreshold / 30) * 100;

    return Math.round(consistency);
  } catch (error) {
    console.error("Error calculating consistency:", error);
    return 0;
  }
};

// ✅ CALCULATE FINAL ALIGNMENT INDEX
// Final Alignment Index = (ATS × 0.7) + (Consistency × 0.3)
const calculateFinalIndex = (atsValue, consistencyValue) => {
  const finalIndex = atsValue * 0.7 + consistencyValue * 0.3;
  return Math.round(finalIndex);
};

// ✅ UPDATE TODAY'S ALIGNMENT SCORE
exports.updateTodayScore = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayString();

    // Calculate DAS
    const dasData = await calculateDAS(userId, today);

    // Calculate ATS
    const ats = await calculateATS(userId, today, dasData.dailyAlignedScore);

    // Calculate Consistency
    const consistency = await calculateConsistency(userId);

    // Calculate Final Index
    const finalIndex = calculateFinalIndex(ats, consistency);

    // Update or create alignment score
    const alignmentScore = await AlignmentScore.findOneAndUpdate(
      { user: userId, date: today },
      {
        user: userId,
        date: today,
        ...dasData,
        alignmentTrendScore: ats,
        consistency: consistency,
        finalAlignmentIndex: finalIndex,
      },
      { upsert: true, new: true },
    );

    res.status(200).json({
      success: true,
      message: "Alignment score updated",
      data: alignmentScore,
    });
  } catch (error) {
    console.error("Error updating alignment score:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update alignment score",
      error: error.message,
    });
  }
};

// ✅ GET TODAY'S ALIGNMENT SCORE
exports.getTodayScore = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayString();

    let alignmentScore = await AlignmentScore.findOne({
      user: userId,
      date: today,
    });

    // If doesn't exist, calculate it first
    if (!alignmentScore) {
      const dasData = await calculateDAS(userId, today);
      const ats = await calculateATS(userId, today, dasData.dailyAlignedScore);
      const consistency = await calculateConsistency(userId);
      const finalIndex = calculateFinalIndex(ats, consistency);

      alignmentScore = await AlignmentScore.create({
        user: userId,
        date: today,
        ...dasData,
        alignmentTrendScore: ats,
        consistency: consistency,
        finalAlignmentIndex: finalIndex,
      });
    }

    res.status(200).json({
      success: true,
      data: alignmentScore,
    });
  } catch (error) {
    console.error("Error fetching alignment score:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alignment score",
      error: error.message,
    });
  }
};

// ✅ GET ALIGNMENT HISTORY (last 30 days)
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = getDateNDaysAgo(29);
    const today = getTodayString();

    const scores = await AlignmentScore.find({
      user: userId,
      date: { $gte: thirtyDaysAgo, $lte: today },
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: scores,
      count: scores.length,
    });
  } catch (error) {
    console.error("Error fetching alignment history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alignment history",
      error: error.message,
    });
  }
};

// ✅ GET ALIGNMENT STATS
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayString();

    const todayScore = await AlignmentScore.findOne({
      user: userId,
      date: today,
    });

    const thirtyDaysAgo = getDateNDaysAgo(29);
    const allScores = await AlignmentScore.find({
      user: userId,
      date: { $gte: thirtyDaysAgo, $lte: today },
    });

    // Calculate stats
    const avgATS =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((sum, s) => sum + s.alignmentTrendScore, 0) /
              allScores.length,
          )
        : 0;

    const avgFinalIndex =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((sum, s) => sum + s.finalAlignmentIndex, 0) /
              allScores.length,
          )
        : 0;

    const consistencyAvg =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((sum, s) => sum + s.consistency, 0) /
              allScores.length,
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        today: todayScore || null,
        averageATS: avgATS,
        averageFinalIndex: avgFinalIndex,
        averageConsistency: consistencyAvg,
        totalDaysTracked: allScores.length,
        daysAboveThreshold: allScores.filter((s) => s.isAboveThreshold).length,
      },
    });
  } catch (error) {
    console.error("Error fetching alignment stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alignment stats",
      error: error.message,
    });
  }
};
