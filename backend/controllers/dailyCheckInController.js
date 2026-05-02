const DailyCheckIn = require("../models/DailyCheckIn");
const Goal = require("../models/Goal");
const Activity = require("../models/Activity");
const Habit = require("../models/Habit");

const todayStr = () => new Date().toISOString().slice(0, 10);

// ══════════════════════════════════════════════════════════════════════════════
// ALIGNMENT SCORE SYSTEM (Final - from Phase_1_V0_02 document)
//
// AWARENESS  (0–30):  Check-in done (+20) + Reflection written (+10)
// EXECUTION  (0–70):  (Completed on-time activities / 21) × 70
// PENALTY    (0 to -30): missed reflection (-10), missed today (-5),
//                        consecutive miss (-10), frequent miss 5+ (-20 cap)
// FINAL:     clamp(Awareness + Execution - Penalty, 0, 100)
//
// Score labels:
//   0–40   → Misaligned
//   40–70  → Improving
//   70–100 → Aligned
// ══════════════════════════════════════════════════════════════════════════════

// ── AWARENESS (0-30) ─────────────────────────────────────────────────────────
const calcAwareness = async (userId, todayDate) => {
  const checkin = await DailyCheckIn.findOne({ user: userId, date: todayDate });

  const checkInDone = !!checkin;
  const reflectionDone = !!(
    checkin?.realization && checkin.realization.trim().length > 0
  );

  let score = 0;
  if (checkInDone) score += 20;
  if (reflectionDone) score += 10;

  return { score: Math.min(30, score), checkInDone, reflectionDone };
};

// ── EXECUTION (0-70) ─────────────────────────────────────────────────────────
// Only activities completed ON their due date count (on-time completion)
const calcExecution = async (userId) => {
  const goals = await Goal.find({ user: userId, status: "In Progress" });
  if (goals.length === 0)
    return {
      score: 0,
      completed: 0,
      total: 21,
      missedToday: false,
      consecutiveMiss: 0,
    };

  // Pick first active goal for the 21-day model (or aggregate across all)
  let totalCompleted = 0;
  let totalMissed = 0;
  let missedTodayFlag = false;
  const today = todayStr();

  for (const goal of goals) {
    const acts = await Activity.find({
      user: userId,
      linkedGoal: goal._id,
    }).sort({ dueDate: 1 });
    const todayAct = acts.find(
      (a) => a.dueDate && a.dueDate.toISOString().slice(0, 10) === today,
    );
    if (todayAct && todayAct.status !== "Completed") missedTodayFlag = true;

    for (const act of acts) {
      if (act.status === "Completed" && act.dueDate) {
        const dueDay = act.dueDate.toISOString().slice(0, 10);
        const completedDay = act.updatedAt?.toISOString().slice(0, 10) || "";
        // Only on-time: completed on or before due date
        if (completedDay <= dueDay) totalCompleted++;
        // Late = not counted (no reward, no penalty per spec)
      } else if (act.status !== "Completed" && act.dueDate) {
        const dueDay = act.dueDate.toISOString().slice(0, 10);
        if (dueDay < today) totalMissed++; // past due and not completed = missed
      }
    }
  }

  // Consecutive missed days — look at last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const recentCheckins = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ date: 1 });

  let consecutiveMiss = 0;
  let tempMiss = 0;
  for (const ci of recentCheckins) {
    // simplified: check daily activity completion via stored flag
    tempMiss++;
    consecutiveMiss = Math.max(consecutiveMiss, tempMiss);
  }

  const executionPct = Math.min(100, (totalCompleted / 21) * 100);
  const baseScore = Math.round((executionPct / 100) * 70);

  return {
    score: Math.min(70, baseScore),
    completed: totalCompleted,
    total: 21,
    missedToday: missedTodayFlag,
    totalMissed,
    consecutiveMiss,
  };
};

// ── PENALTY (0 to -30) ────────────────────────────────────────────────────────
const calcPenalty = ({
  reflectionDone,
  missedToday,
  consecutiveMiss,
  totalMissed,
}) => {
  let penalty = 0;

  if (!reflectionDone) penalty -= 10; // No reflection for the day
  if (missedToday) penalty -= 5; // Missed today's activity
  if (consecutiveMiss >= 2) penalty -= 10; // 2+ consecutive misses
  if (totalMissed >= 5) penalty = Math.min(penalty, -20); // 5+ missed → override at -20

  // Cap at -30
  penalty = Math.max(penalty, -30);
  return penalty;
};

// ── ALIGNMENT LABEL ──────────────────────────────────────────────────────────
const getAlignmentLabel = (score) => {
  if (score >= 70)
    return {
      label: "Aligned",
      color: "text-success",
      bg: "bg-success/10 border-success/30",
      meaning: "You are consistently repeating what matters. Keep going!",
    };
  if (score >= 40)
    return {
      label: "Improving",
      color: "text-secondary",
      bg: "bg-secondary/10 border-secondary/30",
      meaning: "You are on the right track. Keep building consistency.",
    };
  return {
    label: "Misaligned",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    meaning: "Low awareness or inconsistent action. You need more focus.",
  };
};

// ── LOOP DETECTION ────────────────────────────────────────────────────────────
const detectLoop = async (userId, state) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const last7 = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
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
  const missedHabits = habits.filter(
    (h) => h.days.filter(Boolean).length < h.days.length / 3,
  ).length;

  let loopType = "None",
    severity = "None";
  if (state === "Avoiding" || avoidingDays >= 1 || stuckGoals >= 1) {
    loopType = "Avoidance";
    severity =
      avoidingDays >= 4 || stuckGoals >= 3
        ? "High"
        : avoidingDays >= 2
          ? "Medium"
          : "Low";
  } else if (confusedDays >= 3 || state === "Confused" || state === "Anxious") {
    loopType = "Overthinking";
    severity =
      confusedDays >= 5 ? "High" : confusedDays >= 3 ? "Medium" : "Low";
  } else if (missedHabits >= 2) {
    loopType = "Inconsistency";
    severity = missedHabits >= 4 ? "High" : "Medium";
  }
  return { loopType, severity };
};

// ── SUGGESTED ACTION (Mind State + Loop) ─────────────────────────────────────
const getSuggestedAction = (state, loopType, executionScore) => {
  if (state === "Clear" && executionScore < 21)
    return {
      text: "You're clear — start a small step on your top intent now.",
      showGuidance: false,
    };
  if (state === "Confused")
    return {
      text: "Define 1 priority only. What is the ONE thing that matters most today?",
      showGuidance: true,
    };
  if (state === "Avoiding")
    return {
      text: "Break the task into its smallest possible step. What is the absolute first action?",
      showGuidance: true,
    };
  if (state === "Anxious")
    return {
      text: "Reduce scope. Write your top priority. Do not add anything else today.",
      showGuidance: true,
    };
  if (state === "Focused")
    return {
      text: "You are focused — continue execution. Protect this state.",
      showGuidance: false,
    };
  if (loopType === "Avoidance")
    return {
      text: "Break the task into its smallest step. Start with just 5 minutes.",
      showGuidance: true,
    };
  if (loopType === "Overthinking")
    return {
      text: "Define 1 priority for today only. Action will help more than thinking.",
      showGuidance: true,
    };
  return {
    text: "Start small. Complete today's activity and reflect on it.",
    showGuidance: false,
  };
};

// ── INSIGHT (Loop → State → Score priority) ───────────────────────────────────
const getInsight = (loopType, state, score) => {
  if (loopType === "Avoidance")
    return "You planned tasks but didn't start. This is avoidance, not laziness.";
  if (loopType === "Overthinking")
    return "You are not lacking clarity. You are overthinking before acting.";
  if (loopType === "Inconsistency")
    return "Inconsistency is information — something is misaligned, not wrong with you.";
  if (state === "Clear")
    return score >= 70
      ? "You are clear and aligned. This is your best state — use it."
      : "You feel clear but execution is low. Close the gap.";
  if (state === "Focused")
    return "You are focused. Protect this time — go deep on your top intent.";
  if (state === "Anxious")
    return "Anxiety is information. Reduce scope — do just one thing today.";
  if (state === "Confused")
    return "Confusion means two things are in conflict. Choose one.";
  if (state === "Avoiding")
    return "Something is being avoided. Awareness is the first step.";
  if (score < 40)
    return "Your alignment is low today. Focus on one check-in, one reflection, one activity.";
  return "You showed up. That alone moves you forward.";
};

// ── CONFIRMATION MESSAGE ──────────────────────────────────────────────────────
const getConfirmation = (state) =>
  ({
    Clear:
      "✨ Clear state noted. You have clarity today — move with intention.",
    Confused: "🎯 Confusion noted. Let's define just one priority.",
    Avoiding:
      "🌱 Avoidance acknowledged — without judgment. Awareness is the first step.",
    Focused: "🔥 Focused state confirmed. Protect this and go deep.",
    Anxious:
      "💙 Anxiety acknowledged. Let's reduce scope so today feels manageable.",
  })[state] || "Check-in saved.";

// ── WEEKLY LOOPS ──────────────────────────────────────────────────────────────
const getWeeklyLoops = async (userId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const checkIns = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
  });
  const sev = (n) => (n >= 6 ? "High" : n >= 3 ? "Medium" : "Low");
  const avoidCount = checkIns.filter(
    (c) => c.dailyState === "Avoiding" || c.loopType === "Avoidance",
  ).length;
  const overthinkCount = checkIns.filter(
    (c) => c.dailyState === "Confused" || c.loopType === "Overthinking",
  ).length;
  const inconsistCount = checkIns.filter(
    (c) => c.loopType === "Inconsistency",
  ).length;
  const patterns = [];
  if (avoidCount >= 1)
    patterns.push({
      pattern: "Avoiding important tasks",
      count: avoidCount,
      severity: sev(avoidCount),
    });
  if (overthinkCount >= 1)
    patterns.push({
      pattern: "Overthinking before starting",
      count: overthinkCount,
      severity: sev(overthinkCount),
    });
  if (inconsistCount >= 1)
    patterns.push({
      pattern: "Inconsistent follow-through",
      count: inconsistCount,
      severity: sev(inconsistCount),
    });
  return patterns;
};

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

const getTodayCheckIn = async (req, res) => {
  try {
    const checkIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: todayStr(),
    });
    res.status(200).json({ success: true, data: checkIn });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const getDashboardInsights = async (req, res) => {
  try {
    const today = todayStr();
    const todayCheckIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: today,
    });

    // Awareness streak
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

    // Real-time score for dashboard even before check-in
    const awarenessData = await calcAwareness(req.user.id, today);
    const execData = await calcExecution(req.user.id);
    const penaltyVal = calcPenalty({
      reflectionDone: awarenessData.reflectionDone,
      missedToday: execData.missedToday,
      consecutiveMiss: execData.consecutiveMiss,
      totalMissed: execData.totalMissed,
    });
    const finalScore = Math.max(
      0,
      Math.min(100, awarenessData.score + execData.score + penaltyVal),
    );
    const alignmentLabel = getAlignmentLabel(finalScore);
    const weeklyLoops = await getWeeklyLoops(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        todayCheckIn,
        awarenessStreak,
        weeklyLoops,
        alignmentScore: {
          final: finalScore,
          awareness: awarenessData.score,
          execution: execData.score,
          penalty: penaltyVal,
          label: alignmentLabel,
          detail: {
            checkInDone: awarenessData.checkInDone,
            reflectionDone: awarenessData.reflectionDone,
            completed: execData.completed,
            total: execData.total,
            missedToday: execData.missedToday,
            consecutiveMiss: execData.consecutiveMiss,
            totalMissed: execData.totalMissed,
          },
        },
      },
    });
  } catch (err) {
    console.error("getDashboardInsights:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const createCheckIn = async (req, res) => {
  try {
    const { dailyState, avoidingText, mattersTodayText } = req.body;
    if (!dailyState)
      return res
        .status(400)
        .json({ success: false, message: "Daily state is required" });

    const today = todayStr();
    const { loopType, severity } = await detectLoop(req.user.id, dailyState);

    // Save check-in
    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { user: req.user.id, date: today },
      {
        dailyState,
        avoidingText: avoidingText || "",
        mattersTodayText: mattersTodayText || "",
        avoidanceFlag: dailyState === "Avoiding",
        loopType,
        loopSeverity: severity,
      },
      { upsert: true, new: true },
    );

    // Calculate scores after saving
    const awarenessData = await calcAwareness(req.user.id, today);
    const execData = await calcExecution(req.user.id);
    const penaltyVal = calcPenalty({
      reflectionDone: awarenessData.reflectionDone,
      missedToday: execData.missedToday,
      consecutiveMiss: execData.consecutiveMiss,
      totalMissed: execData.totalMissed,
    });
    const finalScore = Math.max(
      0,
      Math.min(100, awarenessData.score + execData.score + penaltyVal),
    );
    const alignmentLabel = getAlignmentLabel(finalScore);

    // Update clarity score on record
    checkIn.clarityScore = finalScore;
    await checkIn.save();

    // Award XP
    try {
      const { awardXP } = require("./xpController");
      await awardXP(req.user.id, "mood_log");
    } catch {}

    const insight = getInsight(loopType, dailyState, finalScore);
    const suggestedAction = getSuggestedAction(
      dailyState,
      loopType,
      execData.score,
    );
    const confirmation = getConfirmation(dailyState);
    const weeklyLoops = await getWeeklyLoops(req.user.id);

    res.status(200).json({
      success: true,
      message: "Check-in saved!",
      data: {
        checkIn,
        insight,
        suggestedAction,
        weeklyLoops,
        confirmation,
        alignmentLabel,
        alignmentBreakdown: {
          awareness: awarenessData.score,
          execution: execData.score,
          penalty: penaltyVal,
          score: finalScore,
          detail: {
            checkInDone: awarenessData.checkInDone,
            reflectionDone: awarenessData.reflectionDone,
            completed: execData.completed,
            total: execData.total,
            missedToday: execData.missedToday,
          },
        },
      },
    });
  } catch (err) {
    console.error("createCheckIn:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save check-in" });
  }
};

const saveRealization = async (req, res) => {
  try {
    const { realization, realizationTags } = req.body;
    const today = todayStr();
    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { user: req.user.id, date: today },
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

    // Recalculate score since reflection is now done — removes the -10 penalty
    const awarenessData = await calcAwareness(req.user.id, today);
    const execData = await calcExecution(req.user.id);
    const penaltyVal = calcPenalty({
      reflectionDone: true,
      missedToday: execData.missedToday,
      consecutiveMiss: execData.consecutiveMiss,
      totalMissed: execData.totalMissed,
    });
    const finalScore = Math.max(
      0,
      Math.min(100, awarenessData.score + execData.score + penaltyVal),
    );
    const alignmentLabel = getAlignmentLabel(finalScore);

    checkIn.clarityScore = finalScore;
    await checkIn.save();

    res.status(200).json({
      success: true,
      message: "Reflection saved! Alignment Score updated. 🌟",
      data: checkIn,
      newScore: {
        score: finalScore,
        label: alignmentLabel,
        awareness: awarenessData.score,
        execution: execData.score,
        penalty: penaltyVal,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
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
    res
      .status(200)
      .json({ success: true, message: "System updated!", data: checkIn });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const getRealizations = async (req, res) => {
  try {
    const { tag } = req.query;
    const filter = { user: req.user.id, realization: { $ne: "" } };
    if (tag) filter.realizationTags = tag;
    const items = await DailyCheckIn.find(filter)
      .select(
        "date dailyState loopType clarityScore realization realizationTags",
      )
      .sort({ date: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
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
