const { Course, Enrollment } = require("../models/Course");
const { getSkillResources } = require("../data/skillResources");

const SEED_COURSES = [
  {
    title: "Advanced React Patterns",
    category: "Technical",
    duration: "8h",
    instructor: "Jane Doe",
    skillTag: "React",
    skillLevel: "Advanced",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Leadership Fundamentals",
    category: "Leadership",
    duration: "6h",
    instructor: "John Smith",
    skillTag: "",
    skillLevel: "Beginner",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Data Visualization",
    category: "Technical",
    duration: "5h",
    instructor: "Alex Kim",
    skillTag: "Power BI",
    skillLevel: "Intermediate",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Effective Communication",
    category: "Soft Skills",
    duration: "4h",
    instructor: "Maria Garcia",
    skillTag: "",
    skillLevel: "Beginner",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Project Management",
    category: "Management",
    duration: "10h",
    instructor: "David Lee",
    skillTag: "",
    skillLevel: "Intermediate",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Design Thinking",
    category: "Innovation",
    duration: "3h",
    instructor: "Sarah Chen",
    skillTag: "",
    skillLevel: "Beginner",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Node.js & Express Mastery",
    category: "Technical",
    duration: "9h",
    instructor: "James Brown",
    skillTag: "Node.js",
    skillLevel: "Intermediate",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "MongoDB for Developers",
    category: "Technical",
    duration: "6h",
    instructor: "Priya R.",
    skillTag: "MongoDB",
    skillLevel: "Beginner",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Python for Data Science",
    category: "Technical",
    duration: "12h",
    instructor: "Kevin Park",
    skillTag: "Python",
    skillLevel: "Beginner",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "Docker & Kubernetes",
    category: "DevOps",
    duration: "8h",
    instructor: "Lisa Chen",
    skillTag: "Docker",
    skillLevel: "Advanced",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "SQL Masterclass",
    category: "Technical",
    duration: "7h",
    instructor: "Tom Wilson",
    skillTag: "SQL",
    skillLevel: "Beginner",
    isAdminCourse: true,
    status: "approved",
  },
  {
    title: "TypeScript Deep Dive",
    category: "Technical",
    duration: "6h",
    instructor: "Emma Davis",
    skillTag: "TypeScript",
    skillLevel: "Intermediate",
    isAdminCourse: true,
    status: "approved",
  },
];

const seedCourses = async () => {
  const count = await Course.countDocuments();
  if (count === 0) {
    await Course.insertMany(SEED_COURSES);
    console.log("✅ Courses seeded");
  }
};

// GET /api/learning — only approved courses visible to users
const getCourses = async (req, res) => {
  try {
    await seedCourses();
    const { skill, category, level } = req.query;

    const filter = { status: "approved" }; // ✅ Only approved
    if (skill) filter.skillTag = { $regex: new RegExp(skill, "i") };
    if (category && category !== "All") filter.category = category;
    if (level && level !== "All") filter.skillLevel = level;

    const courses = await Course.find(filter)
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });
    const enrollments = await Enrollment.find({ user: req.user.id });

    const enrollmentMap = {};
    enrollments.forEach((e) => {
      enrollmentMap[e.course.toString()] = e.progress;
    });

    const data = courses.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      duration: c.duration,
      instructor: c.instructor,
      skillTag: c.skillTag,
      skillLevel: c.skillLevel,
      videoUrl: c.videoUrl,
      isAdminCourse: c.isAdminCourse,
      uploadedBy: c.uploadedBy?.name || null,
      enrolled: c._id.toString() in enrollmentMap,
      progress:
        c._id.toString() in enrollmentMap ? enrollmentMap[c._id.toString()] : 0,
    }));

    let youtubeLinks = [];
    if (skill) {
      const resources = getSkillResources(skill);
      youtubeLinks = resources.youtube || [];
    }

    res.status(200).json({ success: true, data, youtubeLinks });
  } catch (error) {
    console.error("getCourses error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch courses" });
  }
};

// POST /api/learning/upload — user uploads a course (pending)
const uploadCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      skillLevel,
      videoUrl,
      skillTag,
      duration,
    } = req.body;
    if (!title?.trim() || !category || !skillLevel)
      return res
        .status(400)
        .json({
          success: false,
          message: "Title, category and skill level are required",
        });

    const course = await Course.create({
      title,
      description,
      category,
      skillLevel,
      videoUrl: videoUrl || "",
      skillTag: skillTag || "",
      duration: duration || "TBD",
      instructor: req.user.name || "Community",
      status: "pending", // ❗ NOT published
      uploadedBy: req.user.id,
      isAdminCourse: false,
    });

    res.status(201).json({
      success: true,
      message: "📤 Course submitted! It will be visible after admin approval.",
      data: course,
    });
  } catch (error) {
    console.error("uploadCourse error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upload course" });
  }
};

// GET /api/learning/my-uploads — user sees their uploaded courses + status
const getMyUploads = async (req, res) => {
  try {
    const courses = await Course.find({ uploadedBy: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch uploads" });
  }
};

// POST /api/learning/:courseId/enroll
const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.courseId,
      status: "approved",
    });
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    const existing = await Enrollment.findOne({
      user: req.user.id,
      course: req.params.courseId,
    });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Already enrolled" });

    await Enrollment.create({
      user: req.user.id,
      course: req.params.courseId,
      progress: 0,
    });
    res.status(201).json({ success: true, message: "Enrolled successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to enroll" });
  }
};

// PATCH /api/learning/:courseId/progress
const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress == null || progress < 0 || progress > 100)
      return res
        .status(400)
        .json({ success: false, message: "Progress must be 0-100" });

    const enrollment = await Enrollment.findOneAndUpdate(
      { user: req.user.id, course: req.params.courseId },
      { progress },
      { new: true },
    );
    if (!enrollment)
      return res
        .status(404)
        .json({ success: false, message: "Enrollment not found" });
    res
      .status(200)
      .json({ success: true, message: "Progress updated!", data: enrollment });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update progress" });
  }
};

module.exports = {
  getCourses,
  uploadCourse,
  getMyUploads,
  enrollCourse,
  updateProgress,
};
