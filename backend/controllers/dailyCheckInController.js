const DailyCheckIn = require("../models/DailyCheckIn");
const Goal = require("../models/Goal");
const Activity = require("../models/Activity");
const Habit = require("../models/Habit");

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── TIME SLOT DETECTION ────────────────────────────────────────────────────────
const getTimeSlot = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Midday";
  return "Evening";
};

const getTimeStr = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// ── ALIGNMENT SCORE FORMULA ───────────────────────────────────────────────────
// Awareness (0-30): check-in done (+20) + reflection (+10)
// Execution (0-70): completed on-time activities / 21 * 70
// Penalty   (0 to -30): no reflection (-10), missed today (-5), consecutive miss (-10), 5+ miss (-20)
const calcAlignmentScore = async (userId, todayDate) => {
  const checkIn = await DailyCheckIn.findOne({ user: userId, date: todayDate });
  const checkInDone = checkIn && checkIn.slots.length > 0;
  const reflDone = !!(checkIn?.realization?.trim().length > 0);

  // Awareness
  let awareness = 0;
  if (checkInDone) awareness += 20;
  if (reflDone) awareness += 10;
  awareness = Math.min(30, awareness);

  // Execution — only activities completed ON their due date
  const goals = await Goal.find({ user: userId, status: "In Progress" });
  let completed = 0;
  let missedToday = false;
  const today = todayDate;

  for (const goal of goals) {
    for (const day of goal.dayActivities || []) {
      const dueDay = day.dueDate?.toISOString?.()?.slice(0, 10);
      if (day.status === "Completed" && day.completedAt) {
        const doneDay = new Date(day.completedAt).toISOString().slice(0, 10);
        if (doneDay === dueDay) completed++; // only on-time completions
      }
      if (dueDay === today && day.status !== "Completed") missedToday = true;
    }
  }

  const totalActivities = goals.length * 21 || 21;
  const execPct = Math.min(100, (completed / totalActivities) * 100);
  const execution = Math.round((execPct / 100) * 70);

  // Penalty
  let penalty = 0;
  if (!reflDone) penalty -= 10;
  if (missedToday) penalty -= 5;

  // Consecutive miss check (last 2 days)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yestCI = await DailyCheckIn.findOne({ user: userId, date: yesterday });
  const yestMissed = !yestCI || yestCI.slots.length === 0;
  if (yestMissed && !checkInDone) penalty -= 10;

  // 5+ total miss in 21 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const recentCI = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
  });
  const totalMissed = goals.reduce(
    (s, g) =>
      s +
      (g.dayActivities || []).filter((d) => {
        const dueDay = d.dueDate?.toISOString?.()?.slice(0, 10);
        return dueDay && dueDay < today && d.status !== "Completed";
      }).length,
    0,
  );
  if (totalMissed >= 5) penalty = Math.min(penalty, -20);

  penalty = Math.max(penalty, -30);
  const score = Math.max(0, Math.min(100, awareness + execution + penalty));

  const label =
    score >= 70
      ? { label: "Aligned", color: "#22c55e", bg: "#f0fdf4" }
      : score >= 40
        ? { label: "Improving", color: "#f59e0b", bg: "#fffbeb" }
        : { label: "Misaligned", color: "#ef4444", bg: "#fef2f2" };

  return {
    score,
    awareness,
    execution,
    penalty,
    label,
    detail: { checkInDone, reflDone, completed, totalActivities, missedToday },
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
  const avoidingDays = last7.filter(
    (c) => c.dailyState === "Avoiding" || c.dailyState === "Stressed",
  ).length;
  const confusedDays = last7.filter(
    (c) => c.dailyState === "Confused" || c.dailyState === "Distracted",
  ).length;
  const stuckGoals = await Goal.countDocuments({
    user: userId,
    status: "In Progress",
    progress: { $lt: 10 },
  });

  let loopType = "None",
    severity = "None";
  if (
    state === "Avoiding" ||
    state === "Stressed" ||
    avoidingDays >= 1 ||
    stuckGoals >= 1
  ) {
    loopType = "Avoidance";
    severity =
      avoidingDays >= 4 ? "High" : avoidingDays >= 2 ? "Medium" : "Low";
  } else if (
    confusedDays >= 3 ||
    state === "Confused" ||
    state === "Distracted"
  ) {
    loopType = "Overthinking";
    severity =
      confusedDays >= 5 ? "High" : confusedDays >= 3 ? "Medium" : "Low";
  }
  return { loopType, severity };
};

const getSuggestedAction = (state, loopType, execution) => {
  if (state === "Calm" || state === "Focused" || state === "Energized")
    return {
      text: "You're in a great state — protect this time and go deep on your top intent.",
      showGuidance: false,
    };
  if (state === "Stressed" || loopType === "Avoidance")
    return {
      text: "Break the task into its smallest possible step. Start with just 5 minutes.",
      showGuidance: true,
    };
  if (state === "Distracted" || loopType === "Overthinking")
    return {
      text: "Define 1 priority for today only. What is the ONE thing that matters most?",
      showGuidance: true,
    };
  return {
    text: "Start small. Complete today's activity and reflect on it.",
    showGuidance: false,
  };
};

const getInsight = (loopType, state, score) => {
  if (loopType === "Avoidance")
    return "You planned tasks but didn't start. This is avoidance, not laziness.";
  if (loopType === "Overthinking")
    return "You are not lacking clarity. You are overthinking before acting.";
  if (state === "Calm")
    return score >= 70
      ? "You are calm and aligned. Move forward with intention."
      : "Calm state — now act on it.";
  if (state === "Energized")
    return "Great energy today! Channel it into your most important task.";
  if (state === "Focused")
    return "Focused state. Protect this time — go deep on your top intent.";
  if (state === "Stressed")
    return "Stress is information. Reduce scope — do just one thing today.";
  if (state === "Distracted")
    return "Distraction is a signal. Pick ONE thing and close everything else.";
  return "You showed up. That alone moves you forward.";
};

const getConfirmation = (state) =>
  ({
    Calm: "😌 Calm state noted. Move with intention today.",
    Focused: "🎯 Focused! Protect this state and go deep.",
    Stressed:
      "💙 Stress acknowledged. Let's reduce scope — one thing at a time.",
    Distracted: "🌱 Noted. Pick one priority and close the noise.",
    Energized: "⚡ Energized! Channel this into your most important task.",
    Clear: "✨ Clear state. Move forward with intention.",
    Confused: "🎯 Confusion noted. Let's define just one priority.",
    Avoiding: "🌱 Avoidance acknowledged. Awareness is the first step.",
    Anxious: "💙 Anxiety acknowledged. Let's reduce scope.",
  })[state] || "Check-in saved.";

const getWeeklyLoops = async (userId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const checkIns = await DailyCheckIn.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
  });
  const sev = (n) => (n >= 5 ? "High" : n >= 3 ? "Medium" : "Low");
  const avoidCount = checkIns.filter(
    (c) =>
      ["Avoiding", "Stressed"].includes(c.dailyState) ||
      c.loopType === "Avoidance",
  ).length;
  const overthinkCount = checkIns.filter(
    (c) =>
      ["Confused", "Distracted"].includes(c.dailyState) ||
      c.loopType === "Overthinking",
  ).length;
  const patterns = [];
  if (avoidCount >= 1)
    patterns.push({
      pattern: "Avoidance / Stress pattern",
      count: avoidCount,
      severity: sev(avoidCount),
    });
  if (overthinkCount >= 1)
    patterns.push({
      pattern: "Overthinking / Distraction loop",
      count: overthinkCount,
      severity: sev(overthinkCount),
    });
  return patterns;
};

// ── GET /api/checkin/today ────────────────────────────────────────────────────
const getTodayCheckIn = async (req, res) => {
  try {
    const checkIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: todayStr(),
    });
    const scoreData = await calcAlignmentScore(req.user.id, todayStr());
    res
      .status(200)
      .json({ success: true, data: checkIn, alignmentScore: scoreData });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// ── GET /api/checkin/dashboard ────────────────────────────────────────────────
const getDashboardInsights = async (req, res) => {
  try {
    const today = todayStr();
    const todayCheckIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: today,
    });
    const allCheckIns = await DailyCheckIn.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    let awarenessStreak = 0;
    for (let i = 0; i < allCheckIns.length; i++) {
      const expected = new Date(Date.now() - i * 86400000)
        .toISOString()
        .slice(0, 10);
      if (allCheckIns[i]?.date === expected && allCheckIns[i].slots.length > 0)
        awarenessStreak++;
      else break;
    }
    const scoreData = await calcAlignmentScore(req.user.id, today);
    const weeklyLoops = await getWeeklyLoops(req.user.id);
    res
      .status(200)
      .json({
        success: true,
        data: {
          todayCheckIn,
          awarenessStreak,
          weeklyLoops,
          alignmentScore: scoreData,
        },
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// ── POST /api/checkin — add one slot (Morning / Midday / Evening) ─────────────
const createCheckIn = async (req, res) => {
  try {
    const { dailyState, avoidingText, mattersTodayText, note } = req.body;
    if (!dailyState)
      return res
        .status(400)
        .json({ success: false, message: "Daily state is required" });

    const today = todayStr();
    const slot = getTimeSlot();
    const timeStr = getTimeStr();

    // Get or create today's document
    let checkIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: today,
    });
    if (!checkIn) {
      checkIn = new DailyCheckIn({ user: req.user.id, date: today, slots: [] });
    }

    // Check if this slot already used
    const slotUsed = checkIn.slots.some((s) => s.slot === slot);
    if (slotUsed) {
      return res
        .status(400)
        .json({
          success: false,
          message: `You've already checked in for the ${slot} slot today.`,
        });
    }

    // Max 3 slots
    if (checkIn.slots.length >= 3) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You have completed all 3 check-ins for today.",
        });
    }

    // Add slot
    checkIn.slots.push({
      slot,
      state: dailyState,
      note: note || "",
      time: timeStr,
    });
    checkIn.dailyState = dailyState; // latest state
    checkIn.avoidingText = avoidingText || checkIn.avoidingText;
    checkIn.mattersTodayText = mattersTodayText || checkIn.mattersTodayText;
    checkIn.avoidanceFlag =
      dailyState === "Avoiding" || dailyState === "Stressed";

    const { loopType, severity } = await detectLoop(req.user.id, dailyState);
    checkIn.loopType = loopType;
    checkIn.loopSeverity = severity;

    await checkIn.save();

    // Recalculate score after check-in
    const scoreData = await calcAlignmentScore(req.user.id, today);
    checkIn.clarityScore = scoreData.score;
    await checkIn.save();

    try {
      const { awardXP } = require("./xpController");
      await awardXP(req.user.id, "mood_log");
    } catch {}

    const insight = getInsight(loopType, dailyState, scoreData.score);
    const suggestedAction = getSuggestedAction(
      dailyState,
      loopType,
      scoreData.execution,
    );
    const confirmation = getConfirmation(dailyState);
    const weeklyLoops = await getWeeklyLoops(req.user.id);

    // Which slots are still available
    const usedSlots = checkIn.slots.map((s) => s.slot);
    const allSlots = ["Morning", "Midday", "Evening"];
    const availableSlots = allSlots.filter((s) => !usedSlots.includes(s));

    res.status(200).json({
      success: true,
      message: `${slot} check-in saved!`,
      data: {
        checkIn,
        insight,
        suggestedAction,
        weeklyLoops,
        confirmation,
        alignmentLabel: scoreData.label,
        alignmentBreakdown: { ...scoreData },
        currentSlot: slot,
        availableSlots,
        slotsUsed: checkIn.slots.length,
      },
    });
  } catch (err) {
    console.error("createCheckIn:", err);
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to save check-in",
      });
  }
};

// ── PATCH /api/checkin/realization ────────────────────────────────────────────
const saveRealization = async (req, res) => {
  try {
    const { realization, realizationTags } = req.body;
    const today = todayStr();
    let checkIn = await DailyCheckIn.findOneAndUpdate(
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
        .json({ success: false, message: "Check in first today" });

    // Recalculate score — reflection removes the -10 penalty
    const scoreData = await calcAlignmentScore(req.user.id, today);
    checkIn.clarityScore = scoreData.score;
    await checkIn.save();

    res.status(200).json({
      success: true,
      message: "Reflection saved! Score updated. 🌟",
      data: checkIn,
      newScore: scoreData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// ── POST /api/checkin/guidance-update ─────────────────────────────────────────
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
      { new: true, upsert: false },
    );
    if (!checkIn)
      return res
        .status(404)
        .json({ success: false, message: "Check in first" });
    res
      .status(200)
      .json({ success: true, message: "System updated!", data: checkIn });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// ── GET /api/checkin/realizations ─────────────────────────────────────────────
const getRealizations = async (req, res) => {
  try {
    const { tag } = req.query;
    const filter = { user: req.user.id, realization: { $ne: "" } };
    if (tag) filter.realizationTags = tag;
    const items = await DailyCheckIn.find(filter)
      .select(
        "date dailyState loopType clarityScore realization realizationTags slots",
      )
      .sort({ date: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// ── GET /api/checkin/history — score history for Insights page ────────────────
const getScoreHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 86400000)
      .toISOString()
      .slice(0, 10);
    const checkIns = await DailyCheckIn.find({
      user: req.user.id,
      date: { $gte: since },
    }).sort({ date: 1 });

    const history = checkIns.map((ci) => ({
      date: ci.date,
      score: ci.clarityScore || 0,
      state: ci.dailyState,
      loopType: ci.loopType,
      loopSeverity: ci.loopSeverity,
      realization: ci.realization,
      slotsCount: ci.slots?.length || 0,
      slots: ci.slots || [],
      awareness: (ci.slots?.length > 0 ? 20 : 0) + (ci.realization ? 10 : 0),
      hasReflection: !!ci.realization,
    }));

    // Summary stats
    const scores = history.map((h) => h.score).filter((s) => s > 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const streakDays = history.filter((h) => h.slotsCount > 0).length;
    const stateCounts = {};
    history.forEach((h) => {
      if (h.state) stateCounts[h.state] = (stateCounts[h.state] || 0) + 1;
    });
    const mostCommonState =
      Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    res.status(200).json({
      success: true,
      data: {
        history,
        avgScore,
        bestScore,
        streakDays,
        mostCommonState,
        totalDays: history.length,
        stateCounts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// ── GET /api/checkin/slot-status — which slots are available today ─────────────
const getSlotStatus = async (req, res) => {
  try {
    const checkIn = await DailyCheckIn.findOne({
      user: req.user.id,
      date: todayStr(),
    });
    const usedSlots = checkIn?.slots?.map((s) => s.slot) || [];
    const allSlots = ["Morning", "Midday", "Evening"];
    const currentSlot = getTimeSlot();
    const available = allSlots.filter((s) => !usedSlots.includes(s));
    const canCheckIn = available.includes(currentSlot);

    res.status(200).json({
      success: true,
      data: {
        usedSlots,
        availableSlots: available,
        currentSlot,
        canCheckIn,
        slotsUsed: usedSlots.length,
      },
    });
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
  getScoreHistory,
  getSlotStatus,
};
