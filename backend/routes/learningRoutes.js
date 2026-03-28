const express = require("express");
const router = express.Router();
const {
  getCourses,
  enrollCourse,
  updateProgress,
} = require("../controllers/learningController");
const protect = require("../utils/protect");

router.use(protect);

router.get("/", getCourses);
router.post("/:courseId/enroll", enrollCourse);
router.patch("/:courseId/progress", updateProgress);

module.exports = router;
