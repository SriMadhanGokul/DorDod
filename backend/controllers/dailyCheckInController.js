const DailyCheckIn = require("../models/DailyCheckIn");
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const UserScore = require("../models/UserScore");
const { Enrollment } = require("../models/Course");

const todayStr = () => new Date().toISOString().slice(0, 10);

// ══════════════════════════════════════════════════════════════════════════════
// 7. CLARITY SCORE LOGIC (exact formula from final requirement)
// Awareness  (8–30) : Check-in + streak + reflection
// Alignment  (8–40) : Intent vs Execution
// Loop Penalty(0–30): Based on loop frequency
// Final: Clarity = Awareness + Alignment - Loop Penalty
// ══════════════════════════════════════════════════════════════════════════════
const calcClarityScore = async (userId, state) => {
  // ── Component 1: Awareness (8–30) ─────────────────────────────────────────
  const recentCheckIns = await DailyCheckIn.find({ user: userId })
    .sort({ date: -1 })
    .limit(7);

  const streakDays = recentCheckIns.length; // consecutive days (max 7)
  const hasReflection = recentCheckIns.some(
    (c) => c.realization && c.realization.length > 5,
  );

  let awareness = 8; // minimum floor
  awareness += Math.min(15, streakDays * 2.5); // up to +15 for streak
  awareness += hasReflection ? 7 : 0; // +7 for writing realizations
  awareness = Math.min(30, Math.round(awareness)); // cap at 30

  // ── Component 2: Alignment (8–40) ─────────────────────────────────────────
  const goals = await Goal.find({ user: userId, status: "In Progress" });
  const avgGoalProgress =
    goals.length > 0
      ? goals.reduce((s, g) => s + g.progress, 0) / goals.length
      : 0;

  // Habit consistency
  const habits = await Habit.find({ user: userId });
  const habitConsistency =
    habits.length > 0
      ? habits.reduce(
          (s, h) => s + (h.days.filter(Boolean).length / 21) * 100,
          0,
        ) / habits.length
      : 0;

  // Learning progress
  const enrollments = await Enrollment.find({ user: userId });
  const learningAvg =
    enrollments.length > 0
      ? enrollments.reduce((s, e) => s + (e.progress || 0), 0) /
        enrollments.length
      : 0;

  const alignmentRaw =
    avgGoalProgress * 0.5 + habitConsistency * 0.3 + learningAvg * 0.2;
  let alignment = 8 + Math.round((alignmentRaw / 100) * 32); // 8 floor, up to 40
  alignment = Math.min(40, alignment);

  // ── Component 3: Loop Penalty (0–30) ──────────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const last7 = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
  });
  const loopCount = last7.filter((c) => c.loopType !== "None").length;
  const loopPenalty = Math.min(30, loopCount * 5); // +5 per loop day, max 30

  const score = Math.max(0, Math.min(100, awareness + alignment - loopPenalty));
  return { score, awareness, alignment, loopPenalty };
};

// Clarity label from score range
const getClarityLabel = (score) => {
  if (score >= 70)
    return {
      label: "High",
      color: "text-success",
      bg: "bg-success/10 border-success/30",
    };
  if (score >= 40)
    return {
      label: "Moderate",
      color: "text-secondary",
      bg: "bg-secondary/10 border-secondary/30",
    };
  return {
    label: "Low",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// 4. LOOP DETECTION WITH SEVERITY
// ══════════════════════════════════════════════════════════════════════════════
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

  let loopType = "None";
  let severity = "None";

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
    severity =
      missedHabits >= 4 ? "High" : missedHabits >= 2 ? "Medium" : "Low";
  }

  return { loopType, severity };
};

// ══════════════════════════════════════════════════════════════════════════════
// 5. SUGGESTED ACTION ENGINE
// Priority: state + execution level
// ══════════════════════════════════════════════════════════════════════════════
const getSuggestedAction = (state, loopType, executionPct) => {
  // Exact conditions from final requirement
  if (state === "Clear" && executionPct < 30)
    return {
      text: "You're clear — now start a small step on your top intent",
      type: "start-small",
      showGuidance: false,
    };
  if (state === "Confused")
    return {
      text: "Define 1 priority only. What is the ONE thing that matters most today?",
      type: "define-priority",
      showGuidance: true,
    };
  if (state === "Avoiding")
    return {
      text: "Break the task into its smallest possible step. What is the absolute first action?",
      type: "break-task",
      showGuidance: true,
    };
  if (state === "Anxious")
    return {
      text: "Reduce scope. Write your top priority. Do not add anything else.",
      type: "reduce-scope",
      showGuidance: true,
    };
  if (state === "Focused")
    return {
      text: "You are focused — continue execution. Protect this state.",
      type: "continue",
      showGuidance: false,
    };
  // Loop overrides
  if (loopType === "Avoidance")
    return {
      text: "Break the task into its smallest step. Start with just 5 minutes.",
      type: "break-task",
      showGuidance: true,
    };
  if (loopType === "Overthinking")
    return {
      text: "Define 1 priority for today only. Thinking more won't help — action will.",
      type: "define-priority",
      showGuidance: true,
    };
  if (loopType === "Inconsistency")
    return {
      text: "Pick 1 behavior to repeat today. Just once. That's enough.",
      type: "consistency",
      showGuidance: false,
    };
  return {
    text: "Start small. Check in on your top intent.",
    type: "general",
    showGuidance: false,
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// 6. INSIGHT ENGINE — Priority: Loop rules → Mind state → Clarity modifier
// ══════════════════════════════════════════════════════════════════════════════
const getInsight = (
  loopType,
  state,
  clarityScore,
  executionPct,
  behaviorPct,
) => {
  // Priority 1: Loop rules (override everything)
  if (loopType === "Avoidance") {
    if (executionPct < 20)
      return "You have intent but no action. This is avoidance, not laziness. Something is blocking the start.";
    return "You planned tasks but didn't start. This is avoidance, not laziness.";
  }
  if (loopType === "Overthinking") {
    if (clarityScore > 50)
      return "You have clarity but aren't moving. Overthinking is your current loop — not lack of knowledge.";
    return "You are not lacking clarity. You are overthinking before acting.";
  }
  if (loopType === "Inconsistency") {
    if (behaviorPct < 30)
      return "Your behavior pattern is inconsistent. Something in your environment or schedule is misaligned.";
    return "Inconsistency is information — something is misaligned, not wrong with you.";
  }

  // Priority 2: Mind state rules
  if (state === "Clear")
    return clarityScore >= 70
      ? "You are clear and aligned. This is your best state — use it well."
      : "You feel clear but execution is low. Close the gap between intention and action.";
  if (state === "Focused")
    return "You are in a focused state. Protect this time — go deep on your top intent.";
  if (state === "Anxious")
    return "Anxiety is information. Something feels unmanageable. Reduce scope — do just one thing.";
  if (state === "Confused")
    return "Confusion means two things are in conflict. Identify them. Then choose one.";
  if (state === "Avoiding")
    return "Something is being avoided. Avoidance is protection. What are you protecting yourself from?";

  // Priority 3: Clarity modifier
  if (clarityScore < 30)
    return "Your clarity is low. Focus on awareness before action today.";
  if (clarityScore >= 70)
    return "Strong clarity score. Keep the momentum going.";
  return "You showed up. That alone moves you forward.";
};

// ══════════════════════════════════════════════════════════════════════════════
// WEEKLY LOOPS
// ══════════════════════════════════════════════════════════════════════════════
const getWeeklyLoops = async (userId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const checkIns = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
  });

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
      severity: avoidCount >= 5 ? "High" : avoidCount >= 3 ? "Medium" : "Low",
    });
  if (overthinkCount >= 1)
    patterns.push({
      pattern: "Overthinking before starting",
      count: overthinkCount,
      severity:
        overthinkCount >= 5 ? "High" : overthinkCount >= 3 ? "Medium" : "Low",
    });
  if (inconsistCount >= 1)
    patterns.push({
      pattern: "Inconsistent follow-through",
      count: inconsistCount,
      severity:
        inconsistCount >= 5 ? "High" : inconsistCount >= 3 ? "Medium" : "Low",
    });

  return patterns;
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. EXTERNAL SYSTEM — real data from modules
// ══════════════════════════════════════════════════════════════════════════════
const getExternalSystem = async (userId) => {
  // Execution: % of Intent (goals) progress
  const goals = await Goal.find({ user: userId, status: { $ne: "Completed" } });
  const execution =
    goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
      : 0;

  // Behavior: Habit consistency %
  const habits = await Habit.find({ user: userId });
  const behavior =
    habits.length > 0
      ? Math.round(
          habits.reduce(
            (s, h) => s + (h.days.filter(Boolean).length / 21) * 100,
            0,
          ) / habits.length,
        )
      : 0;

  // Growth: Learning progress % (from knowledge/course module)
  const enrollments = await Enrollment.find({ user: userId });
  const growth =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((s, e) => s + (e.progress || 0), 0) /
            enrollments.length,
        )
      : 0;

  return { execution, behavior, growth };
};

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-IN CONFIRMATION MESSAGES
// ══════════════════════════════════════════════════════════════════════════════
const getConfirmationMsg = (state) =>
  ({
    Clear:
      "Clear state acknowledged. You have clarity today — use it with intention. ✨",
    Confused:
      "Confusion noted. That's honest. Let's define just one priority. 🎯",
    Avoiding:
      "Avoidance acknowledged — without judgment. Awareness is already the first step. 🌱",
    Focused: "Focused state confirmed. Protect this. Go deep. 🔥",
    Anxious:
      "Anxiety acknowledged. Let's reduce the scope so today feels manageable. 💙",
  })[state] || "Check-in saved.";

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/checkin/today
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

// GET /api/checkin/dashboard
const getDashboardInsights = async (req, res) => {
  try {
    const todayCheckIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: todayStr(),
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

    const externalSystem = await getExternalSystem(req.user.id);
    const weeklyLoops = await getWeeklyLoops(req.user.id);

    res
      .status(200)
      .json({
        success: true,
        data: { todayCheckIn, awarenessStreak, externalSystem, weeklyLoops },
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /api/checkin
const createCheckIn = async (req, res) => {
  try {
    const { dailyState, avoidingText, mattersTodayText } = req.body;
    if (!dailyState)
      return res
        .status(400)
        .json({ success: false, message: "Daily state is required" });

    const { loopType, severity } = await detectLoop(req.user.id, dailyState);
    const { score, awareness, alignment, loopPenalty } = await calcClarityScore(
      req.user.id,
      dailyState,
    );
    const clarityLabel = getClarityLabel(score);
    const externalSystem = await getExternalSystem(req.user.id);

    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { user: req.user.id, date: todayStr() },
      {
        dailyState,
        avoidingText: avoidingText || "",
        mattersTodayText: mattersTodayText || "",
        avoidanceFlag: dailyState === "Avoiding",
        loopType,
        loopSeverity: severity,
        clarityScore: score,
      },
      { upsert: true, new: true },
    );

    // Award XP
    try {
      const { awardXP } = require("./xpController");
      await awardXP(req.user.id, "mood_log");
    } catch {}

    const insight = getInsight(
      loopType,
      dailyState,
      score,
      externalSystem.execution,
      externalSystem.behavior,
    );
    const suggestedAction = getSuggestedAction(
      dailyState,
      loopType,
      externalSystem.execution,
    );
    const confirmation = getConfirmationMsg(dailyState);
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
        clarityLabel,
        clarityBreakdown: { awareness, alignment, loopPenalty, score },
        externalSystem,
      },
    });
  } catch (err) {
    console.error("createCheckIn error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save check-in" });
  }
};

// PATCH /api/checkin/realization
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
      .json({ success: true, message: "Saved to Insights!", data: checkIn });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /api/checkin/guidance-update
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

// GET /api/checkin/realizations  — Insights page data
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
