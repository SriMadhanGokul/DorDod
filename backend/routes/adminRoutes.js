const express = require("express");
const router = express.Router();
const adminProtect = require("../middleware/adminMiddleware");

const {
  getDashboardStats,
} = require("../controllers/adminDashboardController");
const {
  getAllUsers,
  getUserDetails,
  toggleSuspend,
  deleteUser,
  changeRole,
} = require("../controllers/adminUserController");
const {
  getAllGoals,
  updateGoal,
  deleteGoal,
  getAllHabits,
  resetHabit,
  deleteHabit,
  addAchievement,
  deleteAchievement,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllPosts,
  deletePost,
  deleteComment,
  addDevPlanRec,
  removeDevPlanRec,
  sendNotification,
  getNotifications,
} = require("../controllers/adminContentController");

router.use(adminProtect); // All admin routes protected

// ─── Dashboard ─────────────────────────────────────────────────────────────
router.get("/dashboard", getDashboardStats);

// ─── Users ─────────────────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.patch("/users/:id/suspend", toggleSuspend);
router.patch("/users/:id/role", changeRole);
router.delete("/users/:id", deleteUser);

// ─── Goals ─────────────────────────────────────────────────────────────────
router.get("/goals", getAllGoals);
router.put("/goals/:id", updateGoal);
router.delete("/goals/:id", deleteGoal);

// ─── Habits ────────────────────────────────────────────────────────────────
router.get("/habits", getAllHabits);
router.patch("/habits/:id/reset", resetHabit);
router.delete("/habits/:id", deleteHabit);

// ─── Achievements ──────────────────────────────────────────────────────────
router.post("/achievements", addAchievement);
router.delete("/achievements/:id", deleteAchievement);

// ─── Courses ───────────────────────────────────────────────────────────────
router.get("/courses", getAllCourses);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// ─── Community ─────────────────────────────────────────────────────────────
router.get("/posts", getAllPosts);
router.delete("/posts/:id", deletePost);
router.delete("/posts/:postId/comments/:commentId", deleteComment);

// ─── Dev Plan ──────────────────────────────────────────────────────────────
router.post("/devplan/recommendation", addDevPlanRec);
router.delete("/devplan/:userId/recommendation/:recId", removeDevPlanRec);

// ─── Notifications ─────────────────────────────────────────────────────────
router.get("/notifications", getNotifications);
router.post("/notifications", sendNotification);

module.exports = router;
