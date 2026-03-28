const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const Skill = require("../models/Skill");
const { Enrollment } = require("../models/Course");

// @route GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const uid = req.user.id;

    // ─── Stat counts ─────────────────────────────────────────────────────────
    const [goals, habits, skillDoc, enrollments] = await Promise.all([
      Goal.find({ user: uid }),
      Habit.find({ user: uid }),
      Skill.findOne({ user: uid }),
      Enrollment.find({ user: uid }),
    ]);

    const activeGoals = goals.filter((g) => g.status === "In Progress").length;
    const completedGoals = goals.filter((g) => g.status === "Completed").length;
    const skillsAssessed = skillDoc ? skillDoc.skills.length : 0;
    const habitsTracked = habits.length;

    // Achievements = completed goals + completed courses + mastered skills
    const completedCourses = enrollments.filter(
      (e) => e.progress === 100,
    ).length;
    const masteredSkills = skillDoc
      ? skillDoc.skills.filter((s) => s.current >= s.desired).length
      : 0;
    const achievements = completedGoals + completedCourses + masteredSkills;

    // ─── Radar chart: skill data ──────────────────────────────────────────────
    const radarData = skillDoc
      ? skillDoc.skills.map((s) => ({
          skill: s.name,
          current: s.current,
          desired: s.desired,
        }))
      : [];

    // ─── Active goals list (top 3) ────────────────────────────────────────────
    const activeGoalsList = goals
      .filter((g) => g.status !== "Completed")
      .sort((a, b) => {
        const p = { High: 3, Medium: 2, Low: 1 };
        return (p[b.priority] || 0) - (p[a.priority] || 0);
      })
      .slice(0, 3)
      .map((g) => ({
        _id: g._id,
        title: g.title,
        progress: g.progress,
        priority: g.priority,
      }));

    // ─── First habit for grid display ────────────────────────────────────────
    const firstHabit = habits[0] || null;
    let streak = 0;
    if (firstHabit) {
      for (let i = firstHabit.days.length - 1; i >= 0; i--) {
        if (firstHabit.days[i]) streak++;
        else break;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        stats: { skillsAssessed, activeGoals, habitsTracked, achievements },
        radarData,
        activeGoals: activeGoalsList,
        habit: firstHabit
          ? { name: firstHabit.name, days: firstHabit.days, streak }
          : null,
      },
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data" });
  }
};

module.exports = { getDashboard };
