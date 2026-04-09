const { Course } = require("../models/Course");
const User = require("../models/User");
const {
  sendCourseApprovedEmail,
  sendCourseRejectedEmail,
} = require("../utils/emailService");

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

    // Send approval email to uploader
    if (course.uploadedBy?.email) {
      await sendCourseApprovedEmail(
        course.uploadedBy.email,
        course.uploadedBy.name,
        course.title,
      ).catch((err) => console.error("Email send failed:", err.message));
    }

    res
      .status(200)
      .json({
        success: true,
        message: `✅ "${course.title}" approved!`,
        data: course,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to approve course" });
  }
};

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

    // Send rejection email to uploader
    if (course.uploadedBy?.email) {
      await sendCourseRejectedEmail(
        course.uploadedBy.email,
        course.uploadedBy.name,
        course.title,
        reason || "Does not meet quality standards",
      ).catch((err) => console.error("Email send failed:", err.message));
    }

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
      status: "approved",
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
