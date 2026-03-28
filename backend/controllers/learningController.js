const { Course, Enrollment } = require("../models/Course");
const { getSkillResources } = require("../data/skillResources");

const seedCourses = async () => {
  const count = await Course.countDocuments();
  if (count === 0) {
    await Course.insertMany([
      {
        title: "Advanced React Patterns",
        category: "Technical",
        duration: "8h",
        instructor: "Jane Doe",
        skillTag: "React",
      },
      {
        title: "Leadership Fundamentals",
        category: "Leadership",
        duration: "6h",
        instructor: "John Smith",
        skillTag: "",
      },
      {
        title: "Data Visualization",
        category: "Technical",
        duration: "5h",
        instructor: "Alex Kim",
        skillTag: "Power BI",
      },
      {
        title: "Effective Communication",
        category: "Soft Skills",
        duration: "4h",
        instructor: "Maria Garcia",
        skillTag: "",
      },
      {
        title: "Project Management",
        category: "Management",
        duration: "10h",
        instructor: "David Lee",
        skillTag: "",
      },
      {
        title: "Design Thinking",
        category: "Innovation",
        duration: "3h",
        instructor: "Sarah Chen",
        skillTag: "",
      },
      {
        title: "Node.js & Express Mastery",
        category: "Technical",
        duration: "9h",
        instructor: "James Brown",
        skillTag: "Node.js",
      },
      {
        title: "MongoDB for Developers",
        category: "Technical",
        duration: "6h",
        instructor: "Priya R.",
        skillTag: "MongoDB",
      },
      {
        title: "Python for Data Science",
        category: "Technical",
        duration: "12h",
        instructor: "Kevin Park",
        skillTag: "Python",
      },
      {
        title: "Docker & Kubernetes",
        category: "DevOps",
        duration: "8h",
        instructor: "Lisa Chen",
        skillTag: "Docker",
      },
      {
        title: "SQL Masterclass",
        category: "Technical",
        duration: "7h",
        instructor: "Tom Wilson",
        skillTag: "SQL",
      },
      {
        title: "TypeScript Deep Dive",
        category: "Technical",
        duration: "6h",
        instructor: "Emma Davis",
        skillTag: "TypeScript",
      },
    ]);
    console.log("✅ Courses seeded");
  }
};

// GET /api/learning  — optionally filter by skill
const getCourses = async (req, res) => {
  try {
    await seedCourses();
    const { skill } = req.query;

    let query = {};
    if (skill) {
      // Match courses whose skillTag matches the skill name (case-insensitive)
      query = { skillTag: { $regex: new RegExp(skill, "i") } };
    }

    const courses = await Course.find(query).sort({ createdAt: 1 });
    const enrollments = await Enrollment.find({ user: req.user.id });

    const enrollmentMap = {};
    enrollments.forEach((e) => {
      enrollmentMap[e.course.toString()] = e.progress;
    });

    const data = courses.map((c) => ({
      _id: c._id,
      title: c.title,
      category: c.category,
      duration: c.duration,
      instructor: c.instructor,
      skillTag: c.skillTag,
      enrolled: c._id.toString() in enrollmentMap,
      progress:
        c._id.toString() in enrollmentMap ? enrollmentMap[c._id.toString()] : 0,
    }));

    // If filtering by skill, also get YouTube resources
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

// POST /api/learning/:courseId/enroll
const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
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

module.exports = { getCourses, enrollCourse, updateProgress };
