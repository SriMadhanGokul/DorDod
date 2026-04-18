const DailyCheckIn = require("../models/DailyCheckIn");
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const UserScore = require("../models/UserScore");

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── CLARITY SCORE FORMULA ────────────────────────────────────────────────
const calcClarityScore = async (userId, state, loopType) => {
  const recentCheckIns = await DailyCheckIn.find({ user: userId })
    .sort({ date: -1 })
    .limit(7);

  const consistencyScore = Math.min(30, recentCheckIns.length * 5);

  const goals = await Goal.find({ user: userId, status: "In Progress" });
  const avgGoal =
    goals.length > 0
      ? goals.reduce((s, g) => s + g.progress, 0) / goals.length
      : 0;

  const executionScore = Math.round((avgGoal / 100) * 40);

  const last7 = await DailyCheckIn.find({
    user: userId,
    date: {
      $gte: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    },
  });

  const loopCount = last7.filter((c) => c.loopType !== "None").length;
  const loopPenalty = Math.min(30, loopCount * 5);

  const BASE = {
    Clear: 20,
    Focused: 20,
    Confused: 0,
    Avoiding: -10,
    Anxious: 5,
  };

  const stateAdj = BASE[state] || 0;

  const raw = consistencyScore + executionScore - loopPenalty + stateAdj;
  return Math.max(0, Math.min(100, Math.round(raw)));
};

// ── LOOP DETECTION WITH SEVERITY ─────────────────────────────────────────
const detectLoopWithSeverity = async (userId, state) => {
  const last7 = await DailyCheckIn.find({
    user: userId,
    date: {
      $gte: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    },
  }).sort({ date: -1 });

  const avoidingDays = last7.filter((c) => c.dailyState === "Avoiding").length;
  const confusedDays = last7.filter(
    (c) => c.dailyState === "Confused" || c.dailyState === "Anxious",
  ).length;

  const stuckGoals = await Goal.countDocuments({
    user: userId,
    status: "In Progress",
    progress: { $lt: 10 },
  });

  const habits = await Habit.find({ user: userId });

  const missedHabits = habits.filter((h) => {
    const done = h.days.filter(Boolean).length;
    return done < h.days.length / 3;
  }).length;

  let loopType = "None";
  let severity = "None";

  if (avoidingDays >= 1 || stuckGoals >= 1 || state === "Avoiding") {
    loopType = "Avoidance";
    severity =
      avoidingDays >= 4 || stuckGoals >= 3
        ? "High"
        : avoidingDays >= 2
          ? "Medium"
          : "Low";
  } else if (confusedDays >= 3) {
    loopType = "Overthinking";
    severity =
      confusedDays >= 5 ? "High" : confusedDays >= 3 ? "Medium" : "Low";
  } else if (missedHabits >= 2) {
    loopType = "Inconsistency";
    severity =
      missedHabits >= 4 ? "High" : missedHabits >= 2 ? "Medium" : "Low";
  }

  return { loopType, severity };
};

// ── SUGGESTED ACTION ─────────────────────────────────────────────────────
const getSuggestedAction = (state, loopType) => {
  if (loopType === "Avoidance" || state === "Avoiding")
    return {
      text: "Start with 1 small step (5 minutes)",
      type: "micro-action",
      showGuidance: true,
    };

  if (loopType === "Overthinking" || state === "Confused")
    return {
      text: "Define 1 priority for today only",
      type: "clarity",
      showGuidance: true,
    };

  if (loopType === "Inconsistency")
    return {
      text: "Pick 1 behavior to repeat today — just once",
      type: "consistency",
      showGuidance: false,
    };

  if (state === "Anxious")
    return {
      text: "Write down what worries you most — then set it aside",
      type: "grounding",
      showGuidance: true,
    };

  if (state === "Focused")
    return {
      text: "Protect this focused time — go deep on your top intent",
      type: "protect",
      showGuidance: false,
    };

  return {
    text: "Check in on your top intent today",
    type: "general",
    showGuidance: false,
  };
};

// ── WEEKLY LOOPS ─────────────────────────────────────────────────────────
const getWeeklyLoops = async (userId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  const checkIns = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
  });

  const patterns = [];

  const avoidCount = checkIns.filter(
    (c) => c.dailyState === "Avoiding" || c.loopType === "Avoidance",
  ).length;

  const overthinkCount = checkIns.filter(
    (c) => c.dailyState === "Confused" || c.loopType === "Overthinking",
  ).length;

  const inconsistCount = checkIns.filter(
    (c) => c.loopType === "Inconsistency",
  ).length;

  if (overthinkCount >= 1) {
    patterns.push({
      pattern: "Overthinking before starting",
      count: overthinkCount,
      severity:
        overthinkCount >= 5 ? "High" : overthinkCount >= 3 ? "Medium" : "Low",
    });
  }

  if (avoidCount >= 1) {
    patterns.push({
      pattern: "Avoided difficult task",
      count: avoidCount,
      severity: avoidCount >= 5 ? "High" : avoidCount >= 3 ? "Medium" : "Low",
    });
  }

  if (inconsistCount >= 1) {
    patterns.push({
      pattern: "Inconsistent follow-through",
      count: inconsistCount,
      severity:
        inconsistCount >= 5 ? "High" : inconsistCount >= 3 ? "Medium" : "Low",
    });
  }

  return patterns;
};

// ── INSIGHT ──────────────────────────────────────────────────────────────
const getInsight = (loopType, state) => {
  if (loopType === "Avoidance")
    return "You planned tasks but didn't start. This is avoidance, not laziness.";

  if (loopType === "Overthinking")
    return "You are not lacking clarity. You are overthinking before acting.";

  if (loopType === "Inconsistency")
    return "Inconsistency is information — something is misaligned, not wrong with you.";

  if (state === "Clear")
    return "You are clear. Move forward with intention today.";

  if (state === "Focused")
    return "You are focused. Protect this state — go deep.";

  return null;
};

// ── CONTROLLERS ──────────────────────────────────────────────────────────
const getTodayCheckIn = async (req, res) => {
  try {
    const checkIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: todayStr(),
    });

    res.status(200).json({ success: true, data: checkIn });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch check-in" });
  }
};

const getDashboardInsights = async (req, res) => {
  try {
    const todayCheckIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: todayStr(),
    });

    const allCheckIns = await DailyCheckIn.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(30);

    let awarenessStreak = 0;

    for (let i = 0; i < allCheckIns.length; i++) {
      const expected = new Date(Date.now() - i * 86400000)
        .toISOString()
        .slice(0, 10);

      if (allCheckIns[i]?.date === expected) awarenessStreak++;
      else break;
    }

    const goals = await Goal.find({
      user: req.user.id,
      status: { $ne: "Completed" },
    }).limit(10);

    const goalsAvg =
      goals.length > 0
        ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
        : 0;

    const habits = await Habit.find({ user: req.user.id }).limit(10);

    const habitsAvg =
      habits.length > 0
        ? Math.round(
            habits.reduce(
              (s, h) => s + (h.days.filter(Boolean).length / 21) * 100,
              0,
            ) / habits.length,
          )
        : 0;

    const score = await UserScore.findOne({ user: req.user.id });

    const learningXP =
      score?.history?.filter(
        (h) => h.type === "course_complete" || h.type === "skill_learned",
      ).length || 0;

    const learningPct = Math.min(100, learningXP * 10);

    const weeklyLoops = await getWeeklyLoops(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        todayCheckIn,
        awarenessStreak,
        externalSystem: {
          execution: goalsAvg,
          behavior: habitsAvg,
          growth: learningPct,
        },
        weeklyLoops,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch insights" });
  }
};

const createCheckIn = async (req, res) => {
  try {
    const { dailyState, avoidingText, mattersTodayText } = req.body;

    if (!dailyState) {
      return res
        .status(400)
        .json({ success: false, message: "Daily state is required" });
    }

    const { loopType, severity } = await detectLoopWithSeverity(
      req.user.id,
      dailyState,
    );

    const clarityScore = await calcClarityScore(
      req.user.id,
      dailyState,
      loopType,
    );

    const avoidanceFlag =
      dailyState === "Avoiding" || avoidingText?.trim().length > 5;

    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { user: req.user.id, date: todayStr() },
      {
        dailyState,
        avoidingText: avoidingText || "",
        mattersTodayText: mattersTodayText || "",
        avoidanceFlag,
        loopType,
        loopSeverity: severity,
        clarityScore,
      },
      { upsert: true, new: true },
    );

    try {
      const { awardXP } = require("./xpController");
      await awardXP(
        req.user.id,
        "mood_log",
        `Mind State check-in: ${dailyState} | Clarity: ${clarityScore}`,
      );
    } catch {}

    const insight = getInsight(loopType, dailyState);
    const suggestedAction = getSuggestedAction(dailyState, loopType);
    const weeklyLoops = await getWeeklyLoops(req.user.id);

    res.status(200).json({
      success: true,
      message: "Check-in saved!",
      data: { checkIn, insight, suggestedAction, weeklyLoops },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save check-in" });
  }
};

const saveRealization = async (req, res) => {
  try {
    const { realization, realizationTags } = req.body;

    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { user: req.user.id, date: todayStr() },
      {
        realization: realization || "",
        realizationTags: realizationTags || [],
      },
      { new: true },
    );

    if (!checkIn)
      return res
        .status(404)
        .json({ success: false, message: "Check in today first" });

    res
      .status(200)
      .json({ success: true, message: "Realization saved!", data: checkIn });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to save realization" });
  }
};

const postGuidanceUpdate = async (req, res) => {
  try {
    const { goalUpdate, behaviorSuggestion, insight } = req.body;

    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { user: req.user.id, date: todayStr() },
      {
        guidanceSessionDone: true,
        guidanceGoalUpdate: goalUpdate || "",
        guidanceBehaviorSugg: behaviorSuggestion || "",
        guidanceInsight: insight || "",
      },
      { new: true },
    );

    if (!checkIn)
      return res
        .status(404)
        .json({ success: false, message: "Check in today first" });

    res.status(200).json({
      success: true,
      message: "Guidance session recorded!",
      data: checkIn,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to record guidance update" });
  }
};

const getRealizations = async (req, res) => {
  try {
    const { tag } = req.query;

    const filter = {
      user: req.user.id,
      realization: { $ne: "" },
    };

    if (tag) filter.realizationTags = tag;

    const items = await DailyCheckIn.find(filter)
      .select(
        "date dailyState loopType clarityScore realization realizationTags",
      )
      .sort({ date: -1 })
      .limit(30);

    res.status(200).json({ success: true, data: items });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch realizations" });
  }
};

module.exports = {
  getTodayCheckIn,
  getDashboardInsights,
  createCheckIn,
  saveRealization,
  postGuidanceUpdate,
  getRealizations,
};
