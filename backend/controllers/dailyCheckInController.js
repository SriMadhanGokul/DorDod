const DailyCheckIn = require("../models/DailyCheckIn");

// ✅ GET check-in for today
exports.getTodayCheckIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await DailyCheckIn.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    res.status(200).json({
      success: true,
      data: checkIn || {
        date: today.toISOString().split("T")[0],
        mood: "neutral",
        energy: 5,
        focus: 5,
        completed: false,
      },
    });
  } catch (error) {
    console.error("getTodayCheckIn error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch check-in",
    });
  }
};

// ✅ CREATE or UPDATE check-in
exports.createCheckIn = async (req, res) => {
  try {
    const { mood, energy, focus, notes } = req.body;

    // Validation
    if (!mood || !energy || !focus) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (energy < 1 || energy > 10 || focus < 1 || focus > 10) {
      return res.status(400).json({
        success: false,
        message: "Energy and focus must be between 1-10",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find existing check-in for today
    let checkIn = await DailyCheckIn.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (checkIn) {
      // Update existing
      checkIn.mood = mood;
      checkIn.energy = energy;
      checkIn.focus = focus;
      checkIn.notes = notes;
      checkIn.completed = true;
      await checkIn.save();
    } else {
      // Create new
      checkIn = await DailyCheckIn.create({
        userId: req.user.id,
        date: today,
        mood,
        energy,
        focus,
        notes,
        completed: true,
      });
    }

    res.status(200).json({
      success: true,
      message: "Check-in saved successfully",
      data: checkIn,
    });
  } catch (error) {
    console.error("createCheckIn error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save check-in",
    });
  }
};

// ✅ GET check-in history (last 30 days)
exports.getScoreHistory = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await DailyCheckIn.find({
      userId: req.user.id,
      date: {
        $gte: thirtyDaysAgo,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("getScoreHistory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
};

// ✅ GET realizations (insights from check-ins)
exports.getRealizations = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const checkIns = await DailyCheckIn.find({
      userId: req.user.id,
      date: {
        $gte: sevenDaysAgo,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).sort({ date: -1 });

    // Calculate insights
    const avgEnergy =
      checkIns.length > 0
        ? Math.round(
            checkIns.reduce((sum, c) => sum + c.energy, 0) / checkIns.length,
          )
        : 0;

    const avgFocus =
      checkIns.length > 0
        ? Math.round(
            checkIns.reduce((sum, c) => sum + c.focus, 0) / checkIns.length,
          )
        : 0;

    const moodCount = {
      great: checkIns.filter((c) => c.mood === "great").length,
      good: checkIns.filter((c) => c.mood === "good").length,
      neutral: checkIns.filter((c) => c.mood === "neutral").length,
      bad: checkIns.filter((c) => c.mood === "bad").length,
      terrible: checkIns.filter((c) => c.mood === "terrible").length,
    };

    // Generate realizations based on data
    const realizations = [];

    if (avgEnergy >= 7) {
      realizations.push("🔋 Your energy levels are consistently high!");
    } else if (avgEnergy <= 4) {
      realizations.push(
        "⚡ Consider resting more - your energy seems low lately.",
      );
    }

    if (avgFocus >= 7) {
      realizations.push("🎯 Your focus is excellent this week!");
    } else if (avgFocus <= 4) {
      realizations.push(
        "🧠 Try to minimize distractions - your focus needs attention.",
      );
    }

    const mostCommonMood = Object.keys(moodCount).sort(
      (a, b) => moodCount[b] - moodCount[a],
    )[0];

    if (moodCount[mostCommonMood] >= 3) {
      realizations.push(
        `😊 You've been feeling "${mostCommonMood}" most of the time.`,
      );
    }

    res.status(200).json({
      success: true,
      data: {
        realizations,
        stats: {
          avgEnergy,
          avgFocus,
          moodDistribution: moodCount,
          totalCheckIns: checkIns.length,
        },
      },
    });
  } catch (error) {
    console.error("getRealizations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch realizations",
    });
  }
};

// ✅ GET dashboard insights
exports.getDashboardInsights = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIn = await DailyCheckIn.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthCheckIns = await DailyCheckIn.find({
      userId: req.user.id,
      date: {
        $gte: thirtyDaysAgo,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const avgEnergy =
      monthCheckIns.length > 0
        ? Math.round(
            monthCheckIns.reduce((sum, c) => sum + c.energy, 0) /
              monthCheckIns.length,
          )
        : 0;

    const avgFocus =
      monthCheckIns.length > 0
        ? Math.round(
            monthCheckIns.reduce((sum, c) => sum + c.focus, 0) /
              monthCheckIns.length,
          )
        : 0;

    const checkInStreak = calculateStreak(monthCheckIns);

    res.status(200).json({
      success: true,
      data: {
        todayCheckedIn: !!todayCheckIn,
        todayData: todayCheckIn || null,
        monthStats: {
          averageEnergy: avgEnergy,
          averageFocus: avgFocus,
          totalCheckIns: monthCheckIns.length,
          checkInStreak,
        },
      },
    });
  } catch (error) {
    console.error("getDashboardInsights error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard insights",
    });
  }
};

// ✅ SAVE realization/note
exports.saveRealization = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await DailyCheckIn.findOneAndUpdate(
      {
        userId: req.user.id,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      },
      { realization: content },
      { new: true },
    );

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: "No check-in found for today",
      });
    }

    res.status(200).json({
      success: true,
      message: "Realization saved",
      data: checkIn,
    });
  } catch (error) {
    console.error("saveRealization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save realization",
    });
  }
};

// ✅ POST guidance update
exports.postGuidanceUpdate = async (req, res) => {
  try {
    const { guidance } = req.body;

    if (!guidance) {
      return res.status(400).json({
        success: false,
        message: "Guidance is required",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await DailyCheckIn.findOneAndUpdate(
      {
        userId: req.user.id,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      },
      {
        $push: {
          guidanceUpdates: {
            content: guidance,
            timestamp: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: "No check-in found for today",
      });
    }

    res.status(200).json({
      success: true,
      message: "Guidance updated",
      data: checkIn,
    });
  } catch (error) {
    console.error("postGuidanceUpdate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to post guidance update",
    });
  }
};

// ✅ GET slot status (check if today's slot is open)
exports.getSlotStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await DailyCheckIn.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        slotOpen: !checkIn || !checkIn.completed,
        hasCheckIn: !!checkIn,
        checkInData: checkIn || null,
      },
    });
  } catch (error) {
    console.error("getSlotStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch slot status",
    });
  }
};

// ✅ Helper function to calculate check-in streak
function calculateStreak(checkIns) {
  if (checkIns.length === 0) return 0;

  let streak = 0;
  const sortedDates = checkIns
    .map((c) => new Date(c.date).toISOString().split("T")[0])
    .sort()
    .reverse();

  const today = new Date().toISOString().split("T")[0];
  let currentDate = today;

  for (const date of sortedDates) {
    const current = new Date(currentDate);
    const check = new Date(date);

    const diffTime = Math.abs(current - check);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streak++;
      currentDate = date;
    } else {
      break;
    }
  }

  return streak;
}
