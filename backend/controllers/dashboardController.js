const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const DailyCheckIn = require("../models/DailyCheckIn");
const DailyReflection = require("../models/DailyReflection");

const getToday = () => new Date().toISOString().split("T")[0];

// ✅ Helper: Convert Mongoose Map to plain object
const ensurePlainObject = (field) => {
  if (!field) return {};
  if (field instanceof Map) {
    return Object.fromEntries(field);
  }
  return field || {};
};

// ✅ Helper: Count only real date keys (not Mongoose internal ones)
const getCompletedCount = (dayCompletion) => {
  const obj = ensurePlainObject(dayCompletion);
  return Object.keys(obj).filter((key) => !key.startsWith("$")).length;
};

// ✅ NEW: Get Capabilities Summary (learned/total skills)
const getCapabilitiesSummary = async (userId) => {
  try {
    const SkillPath = require("../models/SkillPath");
    const CustomSkill = require("../models/CustomSkill");

    const skillPath = await SkillPath.findOne({ user: userId });
    const customSkills = await CustomSkill.find({ user: userId });

    let totalSkills = 0;
    let learnedSkills = 0;

    // Count from career path
    if (skillPath && skillPath.skills) {
      totalSkills += skillPath.skills.length;
      learnedSkills += skillPath.skills.filter(
        (s) => s.status === "learned",
      ).length;
    }

    // Count from custom skills
    if (customSkills && customSkills.length > 0) {
      totalSkills += customSkills.length;
      learnedSkills += customSkills.filter(
        (s) => s.status === "completed",
      ).length;
    }

    return {
      completed: learnedSkills,
      total: totalSkills,
    };
  } catch (error) {
    console.error("Error getting capabilities summary:", error);
    return { completed: 0, total: 0 };
  }
};

exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday();

    console.log(`\n📊 DASHBOARD METRICS REQUEST`);
    console.log(`   User: ${userId}`);
    console.log(`   Date: ${today}`);

    // ============ GOALS ============
    const allGoals = await Goal.find({ userId }).lean();
    if (!allGoals || allGoals.length === 0) {
      console.log(`   ⚠️  No goals found`);
    }

    const activeGoals = allGoals.filter((g) => g.status === "active");
    const completedGoals = allGoals.filter((g) => g.status === "completed");

    console.log(`   Active Goals: ${activeGoals.length}`);
    console.log(`   Completed Goals: ${completedGoals.length}`);

    // Calculate goal progress
    const goalsWithProgress = activeGoals.map((goal) => {
      const dayCompletion = ensurePlainObject(goal.dayCompletion);
      const completedDays = getCompletedCount(dayCompletion);
      const progress = completedDays > 0 ? 1 : 0;

      console.log(
        `     - ${goal.title}: ${completedDays} days completed (progress: ${progress})`,
      );

      return { goal, completedDays, progress };
    });

    // ============ HABITS ============
    const allHabits = await Habit.find({ userId }).lean();
    if (!allHabits || allHabits.length === 0) {
      console.log(`   ⚠️  No habits found`);
    }

    // ✅ SEPARATE LINKED vs STANDALONE HABITS
    const linkedHabits = allHabits.filter((h) => h.linkedGoal);
    const standaloneHabits = allHabits.filter((h) => !h.linkedGoal);

    console.log(`   Total Habits: ${allHabits.length}`);
    console.log(`   Linked Habits: ${linkedHabits.length}`);
    console.log(`   Standalone Habits: ${standaloneHabits.length}`);

    // ✅ ONLY COUNT GOAL-LINKED HABITS FOR ALIGNMENT SCORING
    const completedLinkedHabitsToday = linkedHabits.filter((h) => {
      if (!h.tracking || h.tracking.length === 0) return false;
      const todayTracking = h.tracking.find((t) => {
        const trackDate = new Date(t.date).toISOString().split("T")[0];
        return trackDate === today && t.status === "completed";
      });
      return !!todayTracking;
    });

    console.log(
      `   Completed Linked Habits Today: ${completedLinkedHabitsToday.length}`,
    );

    // ============ DAILY CHECK-IN & REFLECTION ============
    const checkInToday = await DailyCheckIn.findOne({
      userId,
      date: today,
    }).lean();
    const reflectionToday = await DailyReflection.findOne({
      userId,
      date: today,
    }).lean();

    console.log(`   Check-in Today: ${!!checkInToday}`);
    console.log(`   Reflection Today: ${!!reflectionToday}`);

    // ============ CALCULATE ALIGNMENT SCORE ============
    let alignmentScore = 0;

    // Goal contribution (70%)
    if (activeGoals.length > 0) {
      const goalsProgress = goalsWithProgress.reduce(
        (sum, g) => sum + g.progress,
        0,
      );
      const goalPts = (goalsProgress / activeGoals.length) * 70;
      alignmentScore += goalPts;
      console.log(`   Goal Points: ${Math.round(goalPts)}/70`);
    } else {
      console.log(`   Goal Points: 0/70 (no active goals)`);
    }

    // ✅ HABIT COMPLETION (20%) - ONLY GOAL-LINKED HABITS
    const habitCompletion = {
      completed: completedLinkedHabitsToday.length,
      total: linkedHabits.length,
    };

    if (habitCompletion.total > 0) {
      const habitPts = (habitCompletion.completed / habitCompletion.total) * 20;
      alignmentScore += habitPts;
      console.log(
        `   Habit Points: ${Math.round(habitPts)}/20 (${habitCompletion.completed}/${habitCompletion.total} linked habits)`,
      );
    } else {
      console.log(`   Habit Points: 0/20 (no linked habits)`);
    }

    // Check-in (10%)
    if (checkInToday) {
      alignmentScore += 10;
      console.log(`   Check-in Points: 10/10`);
    } else {
      console.log(`   Check-in Points: 0/10 (no check-in)`);
    }

    alignmentScore = Math.round(alignmentScore);
    console.log(`   ✅ ALIGNMENT SCORE: ${alignmentScore}`);

    // ============ CALCULATE GROWTH SCORE ============
    // ✅ ONLY COUNT GOAL-LINKED HABITS
    const completedLinkedHabits = linkedHabits.filter(
      (h) => h.status === "Completed",
    ).length;
    const achievements = {
      completed: completedGoals.length,
      total: allGoals.length,
    };

    // ============ GET CAPABILITIES DATA ============
    const capabilitiesSummary = await getCapabilitiesSummary(userId);

    const growthScore = Math.min(
      100,
      Math.round(completedLinkedHabits * 2 + achievements.completed * 10),
    );
    console.log(`   ✅ GROWTH SCORE: ${growthScore}`);

    // ============ CALCULATE RISK INDICATOR ============
    let riskScore = 0;
    if (!checkInToday) riskScore += 5;
    // ✅ Only penalize if there are linked habits and none completed
    if (completedLinkedHabitsToday.length === 0 && linkedHabits.length > 0)
      riskScore += 5;

    const missedGoalsCount = activeGoals.filter((g) => {
      const dayCompletion = ensurePlainObject(g.dayCompletion);
      const completed = getCompletedCount(dayCompletion);
      return completed === 0;
    }).length;
    riskScore += missedGoalsCount * 5;

    const finalRiskScore = Math.min(100, riskScore);
    console.log(`   ✅ RISK INDICATOR: ${finalRiskScore}`);

    // ============ HABIT COMPLETION RATE (7-day) ============
    // ✅ ONLY COUNT GOAL-LINKED HABITS
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    let completedDaysCount = 0;
    last7Days.forEach((day) => {
      const completed = linkedHabits.some((h) => {
        if (!h.tracking || h.tracking.length === 0) return false;
        return h.tracking.some(
          (t) =>
            new Date(t.date).toISOString().split("T")[0] === day &&
            t.status === "completed",
        );
      });
      if (completed) completedDaysCount++;
    });

    const habitCompletionRate =
      linkedHabits.length > 0 ? Math.round((completedDaysCount / 7) * 100) : 0;
    console.log(
      `   ✅ HABIT RATE (7-day): ${habitCompletionRate}% (linked habits only)`,
    );

    // ============ TREND DATA ============
    const trend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      trend.push({
        date: dateStr,
        score: Math.max(0, alignmentScore + Math.random() * 20 - 10),
      });
    }

    // ============ SEND RESPONSE ============
    const response = {
      success: true,
      data: {
        alignmentScore,
        alignmentTrend: alignmentScore,
        growthScore,
        riskIndicator: finalRiskScore,
        goalProgress: {
          completed: goalsWithProgress.filter((g) => g.progress > 0).length,
          total: activeGoals.length,
        },
        habitCompletion,
        habitCompletionRate,
        reflectionCount: 0,
        capabilities: capabilitiesSummary,
        achievements,
        stats: {
          activeGoals: activeGoals.length,
          completedGoals: completedGoals.length,
          totalGoals: allGoals.length,
          linkedHabits: linkedHabits.length,
          standaloneHabits: standaloneHabits.length,
          totalHabits: allHabits.length,
          completedLinkedHabitsToday: completedLinkedHabitsToday.length,
        },
        checks: {
          hasCheckedInToday: !!checkInToday,
          hasReflectedToday: !!reflectionToday,
        },
        trend,
      },
    };

    console.log(`✅ Dashboard metrics calculated successfully\n`);
    res.json(response);
  } catch (error) {
    console.error("❌ Dashboard metrics error:", error.message);
    console.error(error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const allGoals = await Goal.find({ userId }).lean();
    const allHabits = await Habit.find({ userId }).lean();

    // ✅ SEPARATE LINKED AND STANDALONE HABITS
    const linkedHabits = allHabits.filter((h) => h.linkedGoal);
    const standaloneHabits = allHabits.filter((h) => !h.linkedGoal);

    res.json({
      success: true,
      data: {
        totalGoals: allGoals.length,
        activeGoals: allGoals.filter((g) => g.status === "active").length,
        completedGoals: allGoals.filter((g) => g.status === "completed").length,
        linkedHabits: linkedHabits.length,
        standaloneHabits: standaloneHabits.length,
        totalHabits: allHabits.length,
        completedLinkedHabits: linkedHabits.filter(
          (h) => h.status === "Completed",
        ).length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
