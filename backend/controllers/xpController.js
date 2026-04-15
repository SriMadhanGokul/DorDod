const UserScore = require("../models/UserScore");
const Notification = require("../models/Notification");

const XP_VALUES = {
  goal_complete: 50,
  goal_75pct: 15,
  habit_day: 10,
  habit_streak_7: 50,
  habit_streak_14: 100,
  habit_streak_21: 200,
  activity_done: 20,
  course_complete: 100,
  course_50pct: 25,
  achievement: 30,
  mood_log: 5,
  skill_learned: 40,
  comeback_bonus: 30,
  weekly_challenge: 150,
  progress_rings: 50,
};

const XP_DESCRIPTIONS = {
  goal_complete: "Completed a Goal",
  goal_75pct: "Reached 75% on a Goal",
  habit_day: "Completed a Habit Day",
  habit_streak_7: "7-Day Streak Bonus!",
  habit_streak_14: "14-Day Streak Bonus!",
  habit_streak_21: "21-Day Streak Bonus!",
  activity_done: "Completed an Activity",
  course_complete: "Completed a Course",
  course_50pct: "Reached 50% on a Course",
  achievement: "Unlocked an Achievement",
  mood_log: "Logged Frame of Mind",
  skill_learned: "Marked Skill as Learned",
  comeback_bonus: "Comeback Bonus (missed yesterday)",
  weekly_challenge: "Completed Weekly Challenge",
  progress_rings: "All 3 Progress Rings Complete",
};

const XP_ICONS = {
  goal_complete: "🎯",
  goal_75pct: "🔥",
  habit_day: "✅",
  habit_streak_7: "🔥🔥",
  habit_streak_14: "💥",
  habit_streak_21: "👑",
  activity_done: "⚡",
  course_complete: "🎓",
  course_50pct: "📚",
  achievement: "🏆",
  mood_log: "😊",
  skill_learned: "🧠",
  comeback_bonus: "🌅",
  weekly_challenge: "🏅",
  progress_rings: "💍",
};

const EMOTIONAL_MSGS = {
  goal_complete: [
    "🏆 GOAL CRUSHED! You are absolutely unstoppable! +50 XP",
    "🎯 You did it! Another goal conquered. Your future self is proud!",
    "🚀 GOAL COMPLETE! The world better watch out for you!",
  ],
  goal_75pct: [
    "🔥 75% there! You're so close — don't you dare stop now! +15 XP",
    "💪 Three quarters done! The finish line is RIGHT THERE. Push!",
  ],
  habit_day: [
    "🔥 Habit done! You just chose your future over excuses. +10 XP",
    "💪 Another day, another win! Your streak is growing! +10 XP",
    "⚡ Daily habit checked! Consistency is your superpower. +10 XP",
  ],
  habit_streak_7: [
    "🔥🔥 7-DAY STREAK! You're on absolute fire! Most people quit at 3. Not you! +50 XP",
  ],
  habit_streak_14: [
    "💥 14 DAYS STRAIGHT! You're in the top 5% of people. Keep going! +100 XP",
  ],
  habit_streak_21: [
    "👑 21 DAYS! You didn't just build a habit — you built CHARACTER. Legend! +200 XP",
  ],
  activity_done: [
    "✅ Activity crushed! Every single step brings you closer. +20 XP",
    "🎉 Done! Progress is progress, no matter how small. +20 XP",
  ],
  course_complete: [
    "🎓 COURSE COMPLETE! Knowledge earned can never be taken away. +100 XP",
  ],
  achievement: [
    "🏅 Achievement unlocked! Every win deserves to be celebrated! +30 XP",
  ],
  mood_log: [
    "😊 Checked in with yourself. Self-awareness is your secret weapon. +5 XP",
  ],
  skill_learned: [
    "🧠 Skill mastered! You just made yourself harder to replace. +40 XP",
  ],
  comeback_bonus: [
    "🌅 WELCOME BACK, WARRIOR! Every day you show up is a victory. +30 XP comeback bonus! 💪",
  ],
  level_up: [
    "🚀 LEVEL UP! You just became even more dangerous! The leaderboard is shaking!",
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const todayStr = () => new Date().toISOString().slice(0, 10);
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
};

const sendNotif = async (userId, title, message, type = "success") => {
  try {
    await Notification.create({ user: userId, title, message, type });
  } catch {}
};

const awardXP = async (userId, eventType, customMsg = "") => {
  try {
    const pts = XP_VALUES[eventType];
    if (!pts) return null;

    let score = await UserScore.findOne({ user: userId });
    if (!score) score = new UserScore({ user: userId });

    const oldLevel = score.level;
    const today = todayStr();

    // Streak logic
    if (eventType === "habit_day") {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);
      if (score.lastActiveDate === yesterday) {
        score.streak += 1;
      } else if (score.lastActiveDate !== today) {
        if (
          score.lastActiveDate &&
          score.lastActiveDate < yesterday &&
          !score.comebackToday
        ) {
          score.totalXP += XP_VALUES.comeback_bonus;
          score.history.push({
            type: "comeback_bonus",
            points: XP_VALUES.comeback_bonus,
            description: pick(EMOTIONAL_MSGS.comeback_bonus),
            createdAt: new Date(),
          });
          score.comebackToday = true;
          await sendNotif(
            userId,
            "🌅 Welcome Back!",
            pick(EMOTIONAL_MSGS.comeback_bonus),
          );
        }
        score.streak = 1;
      }
      score.lastActiveDate = today;
      if (score.streak > score.bestStreak) score.bestStreak = score.streak;
      if (score.streak === 21)
        awardXP(userId, "habit_streak_21").catch(() => {});
      else if (score.streak === 14)
        awardXP(userId, "habit_streak_14").catch(() => {});
      else if (score.streak === 7)
        awardXP(userId, "habit_streak_7").catch(() => {});
    }

    score.totalXP = Math.max(0, score.totalXP + pts);
    score.recalcLevel();

    const msg =
      customMsg ||
      pick(EMOTIONAL_MSGS[eventType] || ["Great work! +" + pts + " XP"]);
    score.history.push({
      type: eventType,
      points: pts,
      description: msg,
      createdAt: new Date(),
    });
    if (score.history.length > 200) score.history = score.history.slice(-200);

    await score.save();

    await sendNotif(
      userId,
      pts > 0 ? "🎉 XP Earned!" : "💔 Missed Today",
      msg,
      pts > 0 ? "success" : "warning",
    );

    if (score.level > oldLevel) {
      await sendNotif(
        userId,
        "🚀 LEVEL UP!",
        `${pick(EMOTIONAL_MSGS.level_up)} You are now ${score.levelName}! 🎊`,
        "success",
      );
    }

    return score;
  } catch (err) {
    console.error("awardXP error:", err.message);
    return null;
  }
};

// GET /api/xp/me
const getMyScore = async (req, res) => {
  try {
    let score = await UserScore.findOne({ user: req.user.id });
    if (!score) score = await UserScore.create({ user: req.user.id });
    res.status(200).json({ success: true, data: score });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch score" });
  }
};

// GET /api/xp/history  — paginated XP history with breakdown
const getMyHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    let score = await UserScore.findOne({ user: req.user.id });
    if (!score) score = await UserScore.create({ user: req.user.id });

    const history = [...score.history].reverse(); // newest first
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paged = history.slice(start, start + parseInt(limit));

    // Breakdown by type
    const breakdown = {};
    score.history.forEach((h) => {
      if (!breakdown[h.type])
        breakdown[h.type] = {
          count: 0,
          total: 0,
          icon: XP_ICONS[h.type] || "⚡",
          label: XP_DESCRIPTIONS[h.type] || h.type,
        };
      breakdown[h.type].count += 1;
      breakdown[h.type].total += h.points;
    });

    res.status(200).json({
      success: true,
      data: {
        score: {
          totalXP: score.totalXP,
          level: score.level,
          levelName: score.levelName,
          streak: score.streak,
          bestStreak: score.bestStreak,
        },
        history: paged,
        breakdown: Object.entries(breakdown)
          .map(([type, v]) => ({ type, ...v }))
          .sort((a, b) => b.total - a.total),
        total: history.length,
        page: parseInt(page),
        limit: parseInt(limit),
        xpValues: XP_VALUES,
        xpDescriptions: XP_DESCRIPTIONS,
        xpIcons: XP_ICONS,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch history" });
  }
};

// GET /api/xp/leaderboard?period=week|month|year|all
const getLeaderboard = async (req, res) => {
  try {
    const Friendship = require("../models/Friendship");
    const { period = "all" } = req.query;

    // For time-based leaderboards, filter history by period
    const getFilteredXP = (score) => {
      if (period === "all") return score.totalXP;
      const now = new Date();
      let cutoff;
      if (period === "week") {
        cutoff = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay(),
        );
      } else if (period === "month") {
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === "year") {
        cutoff = new Date(now.getFullYear(), 0, 1);
      }
      if (!cutoff) return score.totalXP;
      return score.history
        .filter((h) => new Date(h.createdAt) >= cutoff && h.points > 0)
        .reduce((s, h) => s + h.points, 0);
    };

    const allScores = await UserScore.find().populate(
      "user",
      "name avatar email",
    );
    const global = allScores
      .map((s) => ({ ...s.toObject(), periodXP: getFilteredXP(s) }))
      .filter((s) => s.user)
      .sort((a, b) => b.periodXP - a.periodXP)
      .slice(0, 20);

    const friendships = await Friendship.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
      status: "accepted",
    });
    const friendIds = friendships.map((f) =>
      f.requester.toString() === req.user.id.toString()
        ? f.recipient
        : f.requester,
    );
    friendIds.push(req.user.id);

    const friendScores = allScores.filter((s) =>
      friendIds.some((id) => id.toString() === s.user?._id?.toString()),
    );
    const friends = friendScores
      .map((s) => ({ ...s.toObject(), periodXP: getFilteredXP(s) }))
      .filter((s) => s.user)
      .sort((a, b) => b.periodXP - a.periodXP);

    res.status(200).json({ success: true, data: { global, friends, period } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch leaderboard" });
  }
};

// POST /api/xp/award
const awardXPEndpoint = async (req, res) => {
  try {
    const { eventType, description } = req.body;
    const score = await awardXP(req.user.id, eventType, description);
    res.status(200).json({ success: true, data: score });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to award XP" });
  }
};

// Admin: GET /api/admin/xp-overview
const adminXPOverview = async (req, res) => {
  try {
    const total = await UserScore.countDocuments();
    const scores = await UserScore.find()
      .populate("user", "name email")
      .sort({ totalXP: -1 })
      .limit(50);
    const totalXP = scores.reduce((s, sc) => s + sc.totalXP, 0);
    const avgXP = total > 0 ? Math.round(totalXP / total) : 0;
    res
      .status(200)
      .json({
        success: true,
        data: { total, totalXP, avgXP, topScorers: scores.slice(0, 10) },
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

module.exports = {
  getMyScore,
  getMyHistory,
  getLeaderboard,
  awardXPEndpoint,
  awardXP,
  adminXPOverview,
  XP_VALUES,
  XP_DESCRIPTIONS,
  XP_ICONS,
};
