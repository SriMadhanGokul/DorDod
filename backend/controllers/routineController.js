const Routine = require("../models/Routine");
const RoutinePoints = require("../models/RoutinePoints");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayStr(timezone = "UTC") {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

function getCurrentMinutes(timezone = "UTC") {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Returns the conflicting habit name if newStart–newEnd overlaps any existing habit, else null
// Two windows overlap when: newStart < existingEnd AND newEnd > existingStart
async function checkOverlap(
  userId,
  scheduledStart,
  scheduledEnd,
  excludeId = null,
) {
  const existing = await Routine.find({ user: userId, isActive: true });
  const newStart = timeToMinutes(scheduledStart);
  const newEnd = timeToMinutes(scheduledEnd);

  for (const r of existing) {
    if (excludeId && r._id.toString() === excludeId.toString()) continue;
    const exStart = timeToMinutes(r.scheduledStart);
    const exEnd = timeToMinutes(r.scheduledEnd);
    // Classic interval overlap condition
    if (newStart < exEnd && newEnd > exStart) {
      return r.name; // return conflicting habit's name
    }
  }
  return null;
}

function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getWeekDates(mondayStr) {
  const dates = [];
  const base = new Date(mondayStr + "T00:00:00Z");
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function getOrCreatePoints(userId) {
  let rp = await RoutinePoints.findOne({ user: userId });
  if (!rp) rp = await RoutinePoints.create({ user: userId });
  return rp;
}

async function addPointEvent(
  userId,
  type,
  points,
  description,
  routineId = null,
  date,
) {
  const rp = await getOrCreatePoints(userId);

  // Reset weekly points on new week
  const monday = getMondayOfWeek(date);
  if (rp.weekStart !== monday) {
    rp.weeklyPoints = 0;
    rp.weekStart = monday;
  }

  if (points > 0) {
    rp.totalGained = (rp.totalGained || 0) + points;
  } else {
    rp.totalLost = (rp.totalLost || 0) + Math.abs(points);
  }

  rp.totalPoints = Math.max(0, rp.totalPoints + points);
  rp.weeklyPoints = Math.max(0, rp.weeklyPoints + points);
  rp.events.push({ date, type, points, description, routineId });
  await rp.save();
  return rp;
}

function buildPointsSummary(rp) {
  if (!rp)
    return {
      totalPoints: 0,
      weeklyPoints: 0,
      totalGained: 0,
      totalLost: 0,
      currentPoints: 0,
    };

  // Recalculate from events for migration safety (old docs may have 0 totals)
  const events = rp.events || [];
  const gained = events
    .filter((e) => e.points > 0)
    .reduce((s, e) => s + e.points, 0);
  const lost = events
    .filter((e) => e.points < 0)
    .reduce((s, e) => s + Math.abs(e.points), 0);

  // Self-heal stored totals if they're behind
  if ((rp.totalGained || 0) !== gained || (rp.totalLost || 0) !== lost) {
    rp.totalGained = gained;
    rp.totalLost = lost;
    rp.save().catch(() => {});
  }

  return {
    totalPoints: rp.totalPoints || 0,
    weeklyPoints: rp.weeklyPoints || 0,
    totalGained: gained,
    totalLost: lost,
    currentPoints: rp.totalPoints || 0,
  };
}

// ─── Controllers ─────────────────────────────────────────────────────────────

// GET /api/routines
exports.getRoutines = async (req, res) => {
  try {
    const timezone = req.query.timezone || "UTC";
    const today = getTodayStr(timezone);
    const currentMin = getCurrentMinutes(timezone);

    const routines = await Routine.find({
      user: req.user._id,
      isActive: true,
    }).sort({ order: 1, scheduledStart: 1 });

    const annotated = routines.map((r) => {
      const obj = r.toObject();
      const completedToday = r.completions.find((c) => c.date === today);
      const startMin = timeToMinutes(r.scheduledStart);
      const endMin = timeToMinutes(r.scheduledEnd);
      const createdToday =
        r.createdAt.toLocaleDateString("en-CA", { timeZone: timezone }) ===
        today;

      obj.completedToday = !!completedToday;
      obj.completedAt = completedToday?.completedAt || null;
      obj.inWindow = currentMin >= startMin && currentMin <= endMin;
      // KEY FIX: habits created today are NEVER marked as windowPassed (no penalty)
      obj.windowPassed = !createdToday && currentMin > endMin;
      obj.windowUpcoming = currentMin < startMin;
      obj.createdToday = createdToday;
      return obj;
    });

    const totalActive = routines.length;
    const completedCount = annotated.filter((r) => r.completedToday).length;
    const missedCount = annotated.filter(
      (r) => r.windowPassed && !r.completedToday,
    ).length;

    const rp = await RoutinePoints.findOne({ user: req.user._id });
    const todayPoints =
      rp?.events
        .filter((e) => e.date === today)
        .reduce((sum, e) => sum + e.points, 0) || 0;

    res.json({
      routines: annotated,
      summary: {
        total: totalActive,
        completed: completedCount,
        missed: missedCount,
        todayPoints,
        ...buildPointsSummary(rp),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/routines
exports.createRoutine = async (req, res) => {
  try {
    const timezone = req.query.timezone || req.body.timezone || "UTC";

    const count = await Routine.countDocuments({
      user: req.user._id,
      isActive: true,
    });
    if (count >= 12) {
      return res
        .status(400)
        .json({ message: "Maximum 12 habits allowed per day." });
    }

    const {
      name,
      description,
      scheduledStart,
      scheduledEnd,
      category,
      icon,
      color,
    } = req.body;
    if (!name || !scheduledStart || !scheduledEnd) {
      return res
        .status(400)
        .json({ message: "Name, start time, and end time are required." });
    }
    if (timeToMinutes(scheduledStart) >= timeToMinutes(scheduledEnd)) {
      return res
        .status(400)
        .json({ message: "Start time must be before end time." });
    }

    // Overlap check — no two habits can share any part of their time window
    const conflict = await checkOverlap(
      req.user._id,
      scheduledStart,
      scheduledEnd,
    );
    if (conflict) {
      return res.status(400).json({
        message: `Time window overlaps with "${conflict}". Please choose a different time.`,
        overlapError: true,
      });
    }

    const routine = await Routine.create({
      user: req.user._id,
      name,
      description,
      scheduledStart,
      scheduledEnd,
      category,
      icon,
      color,
      order: count,
    });

    res.status(201).json({ routine });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/routines/:id
exports.updateRoutine = async (req, res) => {
  try {
    const routine = await Routine.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!routine)
      return res.status(404).json({ message: "Routine not found." });

    const {
      name,
      description,
      scheduledStart,
      scheduledEnd,
      category,
      icon,
      color,
      order,
    } = req.body;

    if (scheduledStart && scheduledEnd) {
      if (timeToMinutes(scheduledStart) >= timeToMinutes(scheduledEnd)) {
        return res
          .status(400)
          .json({ message: "Start time must be before end time." });
      }
    }

    // Overlap check on edit — exclude current routine from comparison
    if (scheduledStart || scheduledEnd) {
      const newStart = scheduledStart || routine.scheduledStart;
      const newEnd = scheduledEnd || routine.scheduledEnd;
      const conflict = await checkOverlap(
        req.user._id,
        newStart,
        newEnd,
        routine._id,
      );
      if (conflict) {
        return res.status(400).json({
          message: `Time window overlaps with "${conflict}". Please choose a different time.`,
          overlapError: true,
        });
      }
    }

    if (name) routine.name = name;
    if (description !== undefined) routine.description = description;
    if (scheduledStart) routine.scheduledStart = scheduledStart;
    if (scheduledEnd) routine.scheduledEnd = scheduledEnd;
    if (category) routine.category = category;
    if (icon) routine.icon = icon;
    if (color) routine.color = color;
    if (order !== undefined) routine.order = order;

    await routine.save();
    res.json({ routine });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/routines/:id
exports.deleteRoutine = async (req, res) => {
  try {
    const routine = await Routine.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!routine)
      return res.status(404).json({ message: "Routine not found." });
    res.json({ message: "Routine deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/routines/:id/complete
exports.completeRoutine = async (req, res) => {
  try {
    const timezone = req.body.timezone || "UTC";
    const today = getTodayStr(timezone);
    const currentMin = getCurrentMinutes(timezone);

    const routine = await Routine.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true,
    });
    if (!routine)
      return res.status(404).json({ message: "Routine not found." });

    if (routine.completions.find((c) => c.date === today)) {
      return res.status(400).json({ message: "Already completed today." });
    }

    // Enforce time window
    const startMin = timeToMinutes(routine.scheduledStart);
    const endMin = timeToMinutes(routine.scheduledEnd);
    if (currentMin < startMin || currentMin > endMin) {
      const fmt = (t) => {
        const [h, m] = t.split(":");
        const hh = parseInt(h);
        return `${hh % 12 || 12}:${m} ${hh < 12 ? "AM" : "PM"}`;
      };
      return res.status(400).json({
        message: `You can only complete this habit between ${fmt(routine.scheduledStart)} and ${fmt(routine.scheduledEnd)}.`,
        windowError: true,
      });
    }

    routine.completions.push({
      date: today,
      completedAt: new Date(),
      pointsEarned: 5,
      timezone,
    });

    // Streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA", {
      timeZone: timezone,
    });

    if (routine.lastCompletedDate === yesterdayStr) {
      routine.streak += 1;
    } else if (routine.lastCompletedDate !== today) {
      routine.streak = 1;
    }
    if (routine.streak > routine.longestStreak)
      routine.longestStreak = routine.streak;
    routine.lastCompletedDate = today;
    routine.totalPoints += 5;
    await routine.save();

    await addPointEvent(
      req.user._id,
      "habit_complete",
      5,
      `Completed: ${routine.name}`,
      routine._id,
      today,
    );

    // Daily bonus
    const allRoutines = await Routine.find({
      user: req.user._id,
      isActive: true,
    });
    const allDoneToday = allRoutines.every((r) =>
      r.completions.find((c) => c.date === today),
    );

    let bonusAwarded = false;
    let weeklyBonusAwarded = false;

    if (allDoneToday && allRoutines.length > 0) {
      const rp = await getOrCreatePoints(req.user._id);
      const alreadyBonused = rp.events.find(
        (e) => e.date === today && e.type === "daily_bonus",
      );
      if (!alreadyBonused) {
        await addPointEvent(
          req.user._id,
          "daily_bonus",
          10,
          "All habits completed today! 🎉",
          null,
          today,
        );
        bonusAwarded = true;

        // Weekly bonus
        const monday = getMondayOfWeek(today);
        const weekDates = getWeekDates(monday);
        const daysUpToToday = weekDates.filter((d) => d <= today);

        let weeklyPerfect = true;
        for (const date of daysUpToToday) {
          for (const r of allRoutines) {
            if (!r.completions.find((c) => c.date === date)) {
              weeklyPerfect = false;
              break;
            }
          }
          if (!weeklyPerfect) break;
        }

        if (weeklyPerfect && daysUpToToday.length === 7) {
          const rpFresh = await getOrCreatePoints(req.user._id);
          const alreadyWeekly = rpFresh.events.find(
            (e) => e.date === today && e.type === "weekly_bonus",
          );
          if (!alreadyWeekly) {
            await addPointEvent(
              req.user._id,
              "weekly_bonus",
              25,
              "Perfect week! 🏆",
              null,
              today,
            );
            weeklyBonusAwarded = true;
          }
        }
      }
    }

    const rpFinal = await RoutinePoints.findOne({ user: req.user._id });
    res.json({
      message: "Habit completed!",
      pointsEarned: 5,
      dailyBonus: bonusAwarded ? 10 : 0,
      weeklyBonus: weeklyBonusAwarded ? 25 : 0,
      ...buildPointsSummary(rpFinal),
      streak: routine.streak,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/routines/apply-penalties
exports.applyPenalties = async (req, res) => {
  try {
    const timezone = req.body.timezone || "UTC";
    const today = getTodayStr(timezone);
    const currentMin = getCurrentMinutes(timezone);

    const routines = await Routine.find({ user: req.user._id, isActive: true });
    const rp = await getOrCreatePoints(req.user._id);

    let penaltiesApplied = 0;
    for (const r of routines) {
      const endMin = timeToMinutes(r.scheduledEnd);
      const completedToday = r.completions.find((c) => c.date === today);

      // KEY FIX: skip penalty if habit was created today
      const createdToday =
        r.createdAt.toLocaleDateString("en-CA", { timeZone: timezone }) ===
        today;
      if (createdToday) continue;

      if (currentMin > endMin && !completedToday) {
        const alreadyPenalised = rp.events.find(
          (e) =>
            e.date === today &&
            e.type === "penalty" &&
            e.routineId?.toString() === r._id.toString(),
        );
        if (!alreadyPenalised) {
          await addPointEvent(
            req.user._id,
            "penalty",
            -3,
            `Missed: ${r.name}`,
            r._id,
            today,
          );
          if (r.lastCompletedDate !== today && r.streak > 0) {
            r.streak = 0;
            await r.save();
          }
          penaltiesApplied++;
        }
      }
    }

    const rpFinal = await RoutinePoints.findOne({ user: req.user._id });
    res.json({ penaltiesApplied, ...buildPointsSummary(rpFinal) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/routines/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topPoints = await RoutinePoints.find()
      .sort({ totalPoints: -1 })
      .limit(50)
      .populate("user", "name avatar level");

    const leaderboard = topPoints
      .filter((rp) => rp.user)
      .map((rp, index) => ({
        rank: index + 1,
        userId: rp.user._id,
        name: rp.user.name,
        avatar: rp.user.avatar,
        level: rp.user.level || 1,
        totalPoints: rp.totalPoints || 0,
        weeklyPoints: rp.weeklyPoints || 0,
        totalGained: rp.totalGained || 0,
        totalLost: rp.totalLost || 0,
        isCurrentUser: rp.user._id.toString() === req.user._id.toString(),
      }));

    // Current user rank if outside top 50
    let myRank = null;
    const myEntry = leaderboard.find((e) => e.isCurrentUser);
    if (!myEntry) {
      const myPoints = await RoutinePoints.findOne({ user: req.user._id });
      if (myPoints) {
        const rank = await RoutinePoints.countDocuments({
          totalPoints: { $gt: myPoints.totalPoints },
        });
        myRank = {
          rank: rank + 1,
          userId: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar,
          level: req.user.level || 1,
          totalPoints: myPoints.totalPoints || 0,
          weeklyPoints: myPoints.weeklyPoints || 0,
          totalGained: myPoints.totalGained || 0,
          totalLost: myPoints.totalLost || 0,
          isCurrentUser: true,
        };
      }
    }

    res.json({ leaderboard, myRank });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/routines/summary
exports.getSummary = async (req, res) => {
  try {
    const timezone = req.query.timezone || "UTC";
    const today = getTodayStr(timezone);
    const monday = getMondayOfWeek(today);
    const weekDates = getWeekDates(monday);

    const routines = await Routine.find({ user: req.user._id, isActive: true });
    const rp = await RoutinePoints.findOne({ user: req.user._id });

    const weeklyGrid = weekDates.map((date) => {
      const completed = routines.filter((r) =>
        r.completions.find((c) => c.date === date),
      ).length;
      return {
        date,
        completed,
        total: routines.length,
        perfect: completed === routines.length && routines.length > 0,
      };
    });

    const pointsHistory = weekDates.map((date) => {
      const pts =
        rp?.events
          .filter((e) => e.date === date)
          .reduce((s, e) => s + e.points, 0) || 0;
      return { date, points: pts };
    });

    const bestStreak = routines.reduce(
      (max, r) => Math.max(max, r.longestStreak),
      0,
    );

    res.json({
      weeklyGrid,
      pointsHistory,
      bestStreak,
      totalRoutines: routines.length,
      ...buildPointsSummary(rp),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
