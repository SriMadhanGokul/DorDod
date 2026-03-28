const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const SkillPath = require("../models/SkillPath");
const { Enrollment } = require("../models/Course");

const getAnalytics = async (req, res) => {
  try {
    const uid = req.user.id;

    // ─── Goals ───────────────────────────────────────────────────────────────
    const goals = await Goal.find({ user: uid });
    const completedGoals = goals.filter((g) => g.status === "Completed").length;
    const inProgressGoals = goals.filter(
      (g) => g.status === "In Progress",
    ).length;
    const goalsByCategory = {};
    goals.forEach((g) => {
      goalsByCategory[g.category] = (goalsByCategory[g.category] || 0) + 1;
    });

    // ─── Habits ──────────────────────────────────────────────────────────────
    const habits = await Habit.find({ user: uid });
    let totalDays = 0,
      completedDays = 0,
      bestStreak = 0;
    habits.forEach((h) => {
      totalDays += h.days.length;
      completedDays += h.days.filter(Boolean).length;
      let streak = 0;
      for (let i = h.days.length - 1; i >= 0; i--) {
        if (h.days[i]) streak++;
        else break;
      }
      if (streak > bestStreak) bestStreak = streak;
    });
    const habitCompletionRate =
      totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    // ─── Skills (only count skills user actively marked, not full path) ────────
    const skillPath = await SkillPath.findOne({ user: uid });
    // Only count skills user has interacted with (not default 'to-learn')
    const activeSkills = skillPath
      ? skillPath.skills.filter(
          (s) =>
            s.status === "learned" || s.status === "learning" || s.addedToGoal,
        )
      : [];
    const skillsAssessed = activeSkills.length;
    const skillsLearned = activeSkills.filter(
      (s) => s.status === "learned",
    ).length;
    const skillsLearning = activeSkills.filter(
      (s) => s.status === "learning",
    ).length;

    // ─── Learning / Courses ───────────────────────────────────────────────────
    const enrollments = await Enrollment.find({ user: uid }).populate(
      "course",
      "title",
    );
    const coursesEnrolled = enrollments.length;
    const completedCourses = enrollments.filter(
      (e) => e.progress === 100,
    ).length;
    const nearlyDoneCourses = enrollments.filter(
      (e) => e.progress >= 75 && e.progress < 100,
    );
    const avgLearningProgress =
      coursesEnrolled > 0
        ? Math.round(
            enrollments.reduce((s, e) => s + e.progress, 0) / coursesEnrolled,
          )
        : 0;

    // ─── Monthly chart data (last 6 months) ───────────────────────────────────
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
      });
    }

    const monthlyData = months.map((m) => {
      const monthGoals = goals.filter((g) => {
        const d = new Date(g.createdAt);
        return d.getMonth() === m.monthNum && d.getFullYear() === m.year;
      });
      // Habits completed that month
      const monthHabits = habits.filter((h) => {
        const d = new Date(h.createdAt);
        return d.getMonth() === m.monthNum && d.getFullYear() === m.year;
      });
      return {
        month: m.month,
        goals: monthGoals.length,
        completed: monthGoals.filter((g) => g.status === "Completed").length,
        habits: habitCompletionRate,
        skills: skillsLearned,
        courses: enrollments.filter((e) => {
          const d = new Date(e.enrolledAt || e.createdAt);
          return d.getMonth() === m.monthNum && d.getFullYear() === m.year;
        }).length,
      };
    });

    const categoryData = Object.entries(goalsByCategory).map(
      ([name, value]) => ({ name, value }),
    );

    // ─── Key achievements ─────────────────────────────────────────────────────
    const achievements = [];
    if (completedGoals > 0)
      achievements.push(
        `🎯 Completed ${completedGoals} goal${completedGoals > 1 ? "s" : ""}`,
      );
    if (bestStreak >= 7)
      achievements.push(`🔥 ${bestStreak}-day habit streak — impressive!`);
    if (completedCourses > 0)
      achievements.push(
        `📚 Finished ${completedCourses} course${completedCourses > 1 ? "s" : ""}`,
      );
    if (skillsLearned > 0)
      achievements.push(
        `⭐ Mastered ${skillsLearned} skill${skillsLearned > 1 ? "s" : ""} in ${skillPath?.careerPath || "your path"}`,
      );
    if (skillsLearning > 0)
      achievements.push(
        `📖 Currently learning ${skillsLearning} skill${skillsLearning > 1 ? "s" : ""} — keep going!`,
      );
    // Nearly done courses encouragement
    nearlyDoneCourses.forEach((e) => {
      const name = e.course?.title || "a course";
      achievements.push(
        `🏁 Almost there! "${name}" is ${e.progress}% done — finish it!`,
      );
    });
    if (inProgressGoals > 0)
      achievements.push(
        `💪 ${inProgressGoals} goal${inProgressGoals > 1 ? "s" : ""} in progress — stay focused!`,
      );
    if (habits.length > 0 && habitCompletionRate >= 80)
      achievements.push(
        `🌟 ${habitCompletionRate}% habit completion rate — you're on fire!`,
      );
    if (achievements.length === 0)
      achievements.push(
        "🚀 Start your journey — complete goals, track habits & enroll in courses!",
      );

    res.status(200).json({
      success: true,
      data: {
        stats: {
          skillsAssessed,
          skillsLearned,
          skillsLearning,
          careerPath: skillPath?.careerPath || "",
          goalsTotal: goals.length,
          goalsCompleted: completedGoals,
          goalsInProgress: inProgressGoals,
          habitCompletionRate,
          bestStreak,
          totalHabits: habits.length,
          coursesEnrolled,
          coursesCompleted: completedCourses,
          avgLearningProgress,
          nearlyDoneCourses: nearlyDoneCourses.map((e) => ({
            title: e.course?.title || "Course",
            progress: e.progress,
          })),
        },
        monthlyData,
        categoryData,
        achievements,
      },
    });
  } catch (error) {
    console.error("getAnalytics error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch analytics" });
  }
};

module.exports = { getAnalytics };
