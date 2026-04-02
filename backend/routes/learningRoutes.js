const express = require("express");
const router = express.Router();
const {
  getCourses,
  uploadCourse,
  getMyUploads,
  enrollCourse,
  updateProgress,
} = require("../controllers/learningController");
const protect = require("../utils/protect");

router.use(protect);

router.get("/", getCourses);
router.post("/upload", uploadCourse);
router.get("/my-uploads", getMyUploads);
router.post("/:courseId/enroll", enrollCourse);
router.patch("/:courseId/progress", updateProgress);

module.exports = router;
