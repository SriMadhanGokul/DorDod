const DevPlan = require("../models/DevPlan");
const Goal = require("../models/Goal");
const SkillPath = require("../models/SkillPath");
const { Enrollment, Course } = require("../models/Course");

// ── Build personalized plan ────────────────────────────────────────────────────
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

  const recommendations = [];

  learning.forEach((s) =>
    recommendations.push({
      title: `Master ${s.name}`,
      type: "Skill Practice",
      duration: "30 min/day",
      completed: false,
      icon: "FaBookOpen",
      priority: "high",
      reason: `You marked ${s.name} as "learning" in your ${careerPath} path`,
    }),
  );

  inProgressCourses.forEach((e) =>
    recommendations.push({
      title: `Complete: ${e.course?.title}`,
      type: "Course",
      duration: `${100 - e.progress}% remaining`,
      completed: false,
      icon: "FaBook",
      priority: "high",
      reason: `You're ${e.progress}% done — finish it to earn the achievement!`,
    }),
  );

  inProgress.forEach((g) =>
    recommendations.push({
      title: `Work on: ${g.title}`,
      type: "Goal",
      duration: `${100 - g.progress}% remaining`,
      completed: false,
      icon: "FaBullseye",
      priority: "medium",
      reason: `Active goal at ${g.progress}% — keep the momentum going`,
    }),
  );

  toLearn.slice(0, 2).forEach((s) =>
    recommendations.push({
      title: `Start Learning ${s.name}`,
      type: "Skill",
      duration: "1-2 weeks",
      completed: false,
      icon: "FaLightbulb",
      priority: "medium",
      reason: `Next skill in your ${careerPath} path`,
    }),
  );

  notStarted.slice(0, 1).forEach((g) =>
    recommendations.push({
      title: `Start: ${g.title}`,
      type: "Goal",
      duration: "TBD",
      completed: false,
      icon: "FaRocket",
      priority: "low",
      reason: `You haven't started this goal yet — good time to begin!`,
    }),
  );

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Set your first goal",
      type: "Goal",
      duration: "10 min",
      completed: false,
      icon: "FaBullseye",
      priority: "high",
      reason: "Start by adding a goal to generate your plan",
    });
    recommendations.push({
      title: "Choose a skill path",
      type: "Skill",
      duration: "5 min",
      completed: false,
      icon: "FaLightbulb",
      priority: "high",
      reason: "Select a career path in the Skills page",
    });
    recommendations.push({
      title: "Enroll in a course",
      type: "Course",
      duration: "1-2 hours",
      completed: false,
      icon: "FaBook",
      priority: "medium",
      reason: "Browse the Learning Library for courses",
    });
  }

  const milestones = [
    {
      title: "Week 1-2: Foundation",
      desc: "Set up goals, choose skill path, and start first course",
      done: false,
    },
    {
      title: "Week 3-4: Momentum",
      desc: "Complete 1 course and make progress on key skills",
      done: false,
    },
    {
      title: "Week 5-6: Consistency",
      desc: "Build daily habits, track activities",
      done: false,
    },
    {
      title: "Week 7-9: Progress",
      desc: "Achieve 50% on major goals",
      done: false,
    },
    {
      title: "Week 10-12: Achievement",
      desc: "Complete primary goal and review progress",
      done: false,
    },
  ];

  return { recommendations, milestones };
};

// GET /api/devplan
const getDevPlan = async (req, res) => {
  try {
    let plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan) {
      const { recommendations, milestones } = await buildPersonalizedPlan(
        req.user.id,
      );
      plan = await DevPlan.create({
        user: req.user.id,
        recommendations,
        milestones,
      });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    console.error("getDevPlan error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load development plan" });
  }
};

// POST /api/devplan/refresh  — rebuild from current data
const refreshPlan = async (req, res) => {
  try {
    const { recommendations, milestones } = await buildPersonalizedPlan(
      req.user.id,
    );
    const plan = await DevPlan.findOneAndUpdate(
      { user: req.user.id },
      { recommendations, milestones },
      { new: true, upsert: true },
    );
    res
      .status(200)
      .json({ success: true, message: "Plan refreshed!", data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to refresh plan" });
  }
};

// POST /api/devplan/recommendations  — add new recommendation
const addRecommendation = async (req, res) => {
  try {
    const {
      title,
      type,
      duration,
      priority,
      reason,
      startDate,
      endDate,
      linkedCourse,
    } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    if (!type?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Type is required" });
    if (!priority)
      return res
        .status(400)
        .json({ success: false, message: "Priority is required" });
    if (!startDate)
      return res
        .status(400)
        .json({ success: false, message: "Start date is required" });
    if (!endDate)
      return res
        .status(400)
        .json({ success: false, message: "End date is required" });

    let courseTitle = "";
    if (linkedCourse) {
      const course = await Course.findById(linkedCourse).select("title");
      courseTitle = course?.title || "";
    }

    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({
          success: false,
          message: "Plan not found — load the page first",
        });

    plan.recommendations.push({
      title,
      type,
      duration: duration || "",
      priority,
      reason: reason || "",
      startDate,
      endDate,
      linkedCourse: linkedCourse || null,
      courseTitle,
    });
    await plan.save();
    res
      .status(201)
      .json({ success: true, message: "Recommendation added!", data: plan });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to add recommendation" });
  }
};

// PUT /api/devplan/recommendations/:recId  — edit recommendation
const updateRecommendation = async (req, res) => {
  try {
    const {
      title,
      type,
      duration,
      priority,
      reason,
      startDate,
      endDate,
      linkedCourse,
    } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    if (!startDate)
      return res
        .status(400)
        .json({ success: false, message: "Start date is required" });
    if (!endDate)
      return res
        .status(400)
        .json({ success: false, message: "End date is required" });

    let courseTitle = "";
    if (linkedCourse) {
      const course = await Course.findById(linkedCourse).select("title");
      courseTitle = course?.title || "";
    }

    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    const rec = plan.recommendations.id(req.params.recId);
    if (!rec)
      return res
        .status(404)
        .json({ success: false, message: "Recommendation not found" });

    rec.title = title;
    rec.type = type || rec.type;
    rec.duration = duration || rec.duration;
    rec.priority = priority || rec.priority;
    rec.reason = reason || rec.reason;
    rec.startDate = startDate;
    rec.endDate = endDate;
    rec.linkedCourse = linkedCourse || null;
    rec.courseTitle = courseTitle;

    await plan.save();
    res.status(200).json({ success: true, message: "Updated!", data: plan });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update recommendation" });
  }
};

// DELETE /api/devplan/recommendations/:recId
const deleteRecommendation = async (req, res) => {
  try {
    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    plan.recommendations = plan.recommendations.filter(
      (r) => r._id.toString() !== req.params.recId,
    );
    await plan.save();
    res
      .status(200)
      .json({ success: true, message: "Recommendation deleted!", data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

// PATCH /api/devplan/recommendations/:recId/toggle
const toggleRecommendation = async (req, res) => {
  try {
    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    const rec = plan.recommendations.id(req.params.recId);
    if (!rec)
      return res
        .status(404)
        .json({ success: false, message: "Recommendation not found" });
    rec.completed = !rec.completed;
    await plan.save();
    res.status(200).json({ success: true, message: "Updated!", data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /api/devplan/milestones  — add milestone
const addMilestone = async (req, res) => {
  try {
    const { title, desc, startDate, endDate } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    if (!startDate)
      return res
        .status(400)
        .json({ success: false, message: "Start date is required" });
    if (!endDate)
      return res
        .status(400)
        .json({ success: false, message: "End date is required" });

    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    plan.milestones.push({
      title,
      desc: desc || "",
      startDate,
      endDate,
      done: false,
    });
    await plan.save();
    res
      .status(201)
      .json({ success: true, message: "Milestone added!", data: plan });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to add milestone" });
  }
};

// PUT /api/devplan/milestones/:milestoneId
const updateMilestone = async (req, res) => {
  try {
    const { title, desc, startDate, endDate } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    if (!startDate)
      return res
        .status(400)
        .json({ success: false, message: "Start date is required" });
    if (!endDate)
      return res
        .status(400)
        .json({ success: false, message: "End date is required" });

    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    const m = plan.milestones.id(req.params.milestoneId);
    if (!m)
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });

    m.title = title;
    m.desc = desc || m.desc;
    m.startDate = startDate;
    m.endDate = endDate;
    await plan.save();
    res
      .status(200)
      .json({ success: true, message: "Milestone updated!", data: plan });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update milestone" });
  }
};

// DELETE /api/devplan/milestones/:milestoneId
const deleteMilestone = async (req, res) => {
  try {
    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    plan.milestones = plan.milestones.filter(
      (m) => m._id.toString() !== req.params.milestoneId,
    );
    await plan.save();
    res
      .status(200)
      .json({ success: true, message: "Milestone deleted!", data: plan });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete milestone" });
  }
};

// PATCH /api/devplan/milestones/:milestoneId/toggle
const toggleMilestone = async (req, res) => {
  try {
    const plan = await DevPlan.findOne({ user: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    const m = plan.milestones.id(req.params.milestoneId);
    if (!m)
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    m.done = !m.done;
    await plan.save();
    res.status(200).json({ success: true, message: "Updated!", data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

module.exports = {
  getDevPlan,
  refreshPlan,
  addRecommendation,
  updateRecommendation,
  deleteRecommendation,
  toggleRecommendation,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  toggleMilestone,
};
