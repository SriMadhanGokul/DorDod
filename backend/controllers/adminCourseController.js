const { Course } = require("../models/Course");

// GET /api/admin/courses/pending
const getPendingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: "pending" })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch pending courses" });
  }
};

// PATCH /api/admin/courses/:id/approve
const approveCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedAt: new Date(), approvedBy: req.user.id },
      { new: true },
    ).populate("uploadedBy", "name email");

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    res
      .status(200)
      .json({
        success: true,
        message: `✅ "${course.title}" approved and published!`,
        data: course,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to approve course" });
  }
};

// PATCH /api/admin/courses/:id/reject
const rejectCourse = async (req, res) => {
  try {
    const { reason } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectionReason: reason || "Does not meet quality standards",
      },
      { new: true },
    ).populate("uploadedBy", "name email");

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    res
      .status(200)
      .json({
        success: true,
        message: `❌ "${course.title}" rejected.`,
        data: course,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to reject course" });
  }
};

// GET /api/admin/courses — all courses with filters
const getAllCourses = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const courses = await Course.find(filter)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch courses" });
  }
};

// POST /api/admin/courses — admin creates course (auto-approved)
const createCourse = async (req, res) => {
  try {
    const {
      title,
      category,
      duration,
      instructor,
      skillTag,
      skillLevel,
      description,
      videoUrl,
    } = req.body;
    if (!title || !category || !duration || !instructor)
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });

    const course = await Course.create({
      title,
      category,
      duration,
      instructor,
      skillTag: skillTag || "",
      skillLevel: skillLevel || "Beginner",
      description: description || "",
      videoUrl: videoUrl || "",
      status: "approved", // ✅ Admin courses auto-approved
      isAdminCourse: true,
      approvedAt: new Date(),
      approvedBy: req.user.id,
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Course created and published!",
        data: course,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create course" });
  }
};

// PUT /api/admin/courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    res
      .status(200)
      .json({ success: true, message: "Course updated!", data: course });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update course" });
  }
};

// DELETE /api/admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Course deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete course" });
  }
};

// GET /api/admin/skills/user-submitted — view all user custom skills
const getUserSubmittedSkills = async (req, res) => {
  try {
    const CustomSkill = require("../models/CustomSkill");
    const skills = await CustomSkill.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: skills });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user skills" });
  }
};

module.exports = {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getUserSubmittedSkills,
};
