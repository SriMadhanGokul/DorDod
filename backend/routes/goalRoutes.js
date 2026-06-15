const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const {
  getGoals,
  getGoalsByStatus,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  completeGoal,
  pauseGoal,
  resumeGoal,
  activateGoal,
  completeGoalByDay,
  getGoalStats,
} = require("../controllers/goalController");

// ✅ All routes with protect middleware

// GET all goals
router.get("/", protect, getGoals);

// GET goals by status
router.get("/status", protect, getGoalsByStatus);

// GET goal stats
router.get("/stats", protect, getGoalStats);

// GET single goal
router.get("/:goalId", protect, getGoal);

// CREATE goal
router.post("/", protect, createGoal);

// UPDATE goal
router.put("/:goalId", protect, updateGoal);

// COMPLETE goal
router.put("/:goalId/complete", protect, completeGoal);

// PAUSE goal
router.put("/:goalId/pause", protect, pauseGoal);

// RESUME goal
router.put("/:goalId/resume", protect, resumeGoal);

// ACTIVATE goal
router.patch("/:goalId/activate", protect, activateGoal);

// COMPLETE goal by day (21-day plan)
router.patch("/:goalId/day/:dayNumber/complete", protect, completeGoalByDay);

// DELETE goal
router.delete("/:goalId", protect, deleteGoal);

module.exports = router;
