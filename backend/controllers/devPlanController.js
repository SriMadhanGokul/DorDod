const DevPlan = require("../models/DevPlan");
const Goal = require("../models/Goal");
const SkillPath = require("../models/SkillPath");
const { Enrollment } = require("../models/Course");

// Build a personalized dev plan based on user's actual data
const buildPersonalizedPlan = async (userId) => {
  const [goals, skillPath, enrollments] = await Promise.all([
    Goal.find({ user: userId }),
    SkillPath.findOne({ user: userId }),
    Enrollment.find({ user: userId }).populate("course", "title"),
  ]);

  const careerPath = skillPath?.careerPath || "your chosen path";
  const toLearn =
    skillPath?.skills.filter((s) => s.status === "to-learn").slice(0, 4) || [];
  const learning =
    skillPath?.skills.filter((s) => s.status === "learning").slice(0, 3) || [];
  const inProgress = goals
    .filter((g) => g.status === "In Progress")
    .slice(0, 3);
  const notStarted = goals
    .filter((g) => g.status === "Not Started")
    .slice(0, 2);
  const inProgressCourses = enrollments
    .filter((e) => e.progress > 0 && e.progress < 100)
    .slice(0, 2);

  // Build recommendations based on real data
  const recommendations = [];

  // 1. Currently learning skills → top priority
  learning.forEach((s) => {
    recommendations.push({
      title: `Master ${s.name}`,
      type: "Skill Practice",
      duration: "30 min/day",
      completed: false,
      icon: "FaBookOpen",
      priority: "high",
      reason: `You marked ${s.name} as "learning" in your ${careerPath} path`,
    });
  });

  // 2. In-progress courses → finish them
  inProgressCourses.forEach((e) => {
    recommendations.push({
      title: `Complete: ${e.course?.title}`,
      type: "Course",
      duration: `${100 - e.progress}% remaining`,
      completed: false,
      icon: "FaBook",
      priority: "high",
      reason: `You're ${e.progress}% done — finish it to earn the achievement!`,
    });
  });

  // 3. Active goals → work on them
  inProgress.forEach((g) => {
    recommendations.push({
      title: `Work on: ${g.title}`,
      type: "Goal",
      duration: `${100 - g.progress}% remaining`,
      completed: false,
      icon: "FaBullseye",
      priority: "medium",
      reason: `Active goal at ${g.progress}% — keep the momentum going`,
    });
  });

  // 4. Skills to pick up next
  toLearn.slice(0, 2).forEach((s) => {
    recommendations.push({
      title: `Start Learning ${s.name}`,
      type: "Skill",
      duration: "1-2 weeks",
      completed: false,
      icon: "FaLightbulb",
      priority: "medium",
      reason: `Next skill in your ${careerPath} path`,
    });
  });

  // 5. Not started goals → schedule them
  notStarted.slice(0, 1).forEach((g) => {
    recommendations.push({
      title: `Start: ${g.title}`,
      type: "Goal",
      duration: "Schedule now",
      completed: false,
      icon: "FaRocket",
      priority: "low",
      reason: "Goal waiting to be started",
    });
  });

  // Fill with generic if still empty
  if (recommendations.length === 0) {
    recommendations.push(
      {
        title: "Set your first goal",
        type: "Action",
        duration: "5 min",
        completed: false,
        icon: "FaBullseye",
        priority: "high",
        reason: "Start by defining what you want to achieve",
      },
      {
        title: "Choose a career path",
        type: "Action",
        duration: "5 min",
        completed: false,
        icon: "FaRocket",
        priority: "high",
        reason: "Go to Skills page and select your path",
      },
      {
        title: "Enroll in your first course",
        type: "Course",
        duration: "30 min",
        completed: false,
        icon: "FaBook",
        priority: "medium",
        reason: "Start learning with structured courses",
      },
      {
        title: "Create a 21-day habit",
        type: "Habit",
        duration: "Daily",
        completed: false,
        icon: "FaCalendar",
        priority: "medium",
        reason: "Consistency builds expertise",
      },
      {
        title: "Complete your profile",
        type: "Profile",
        duration: "10 min",
        completed: false,
        icon: "FaUser",
        priority: "low",
        reason: "A complete profile helps you track better",
      },
    );
  }

  // Build milestones (4-week plan)
  const milestones = [
    {
      title: "Week 1-2: Foundation",
      desc: skillPath
        ? `Set up your ${careerPath} learning plan. Mark skills you already know as "Learned" and start 2 new skills as "Learning".`
        : "Choose your career path, set your first 3 goals, and enroll in one course.",
      done: false,
    },
    {
      title: "Week 3-4: Build Momentum",
      desc:
        inProgress.length > 0
          ? `Push your active goals forward. Focus on: ${inProgress.map((g) => g.title).join(", ")}.`
          : "Begin working on your goals daily. Aim for 30 minutes of focused learning each day.",
      done: false,
    },
    {
      title: "Week 5-8: Deep Work",
      desc:
        learning.length > 0
          ? `Go deep on: ${learning.map((s) => s.name).join(", ")}. Build a project using these skills.`
          : "Apply your learning in real mini-projects. Practice daily and track your habit streaks.",
      done: false,
    },
    {
      title: "Week 9-12: Review & Level Up",
      desc: "Review your progress, complete pending courses, update skill statuses, and set new goals for the next quarter.",
      done: false,
    },
  ];

  return { recommendations, milestones };
};

// GET /api/devplan
const getDevPlan = async (req, res) => {
  try {
    let plan = await DevPlan.findOne({ user: req.user.id });

    // Always regenerate recommendations from fresh data
    const { recommendations, milestones } = await buildPersonalizedPlan(
      req.user.id,
    );

    if (!plan) {
      plan = await DevPlan.create({
        user: req.user.id,
        recommendations,
        milestones,
      });
    } else {
      // Refresh recommendations but preserve completed status on milestones
      const existingMilestones = plan.milestones || [];
      const mergedMilestones = milestones.map((m, i) => ({
        ...m,
        done: existingMilestones[i]?.done || false,
      }));

      // Refresh recommendations (preserve completed ones by title match)
      const mergedRecs = recommendations.map((r) => {
        const existing = plan.recommendations.find((e) => e.title === r.title);
        return { ...r, completed: existing?.completed || false };
      });

      plan.recommendations = mergedRecs;
      plan.milestones = mergedMilestones;
      await plan.save();
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    console.error("getDevPlan error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch development plan" });
  }
};

// PATCH /api/devplan/recommendations/:recId/toggle
const toggleRecommendation = async (req, res) => {
  try {
    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Dev plan not found" });
    const rec = plan.recommendations.id(req.params.recId);
    if (!rec)
      return res
        .status(404)
        .json({ success: false, message: "Recommendation not found" });
    rec.completed = !rec.completed;
    await plan.save();
    res
      .status(200)
      .json({ success: true, message: "Progress updated!", data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

// PATCH /api/devplan/milestones/:milestoneId/toggle
const toggleMilestone = async (req, res) => {
  try {
    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Dev plan not found" });
    const milestone = plan.milestones.id(req.params.milestoneId);
    if (!milestone)
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    milestone.done = !milestone.done;
    await plan.save();
    res
      .status(200)
      .json({ success: true, message: "Milestone updated!", data: plan });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update milestone" });
  }
};

module.exports = { getDevPlan, toggleRecommendation, toggleMilestone };
