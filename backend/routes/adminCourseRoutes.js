const express = require("express");
const router = express.Router();
const adminProtect = require("../middleware/adminMiddleware");
const {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getUserSubmittedSkills,
} = require("../controllers/adminCourseController");

router.use(adminProtect);

router.get("/courses/pending", getPendingCourses);
router.get("/courses", getAllCourses);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.patch("/courses/:id/approve", approveCourse);
router.patch("/courses/:id/reject", rejectCourse);
router.get("/skills/user-submitted", getUserSubmittedSkills);

module.exports = router;
