const express = require("express");
const {
  getHabits,
  getHabitsByGoal,
  getHabit,
  createHabit,
  updateHabit,
  completeHabit,
  resetHabit,
  linkHabitToGoal,
  unlinkHabitFromGoal,
  deleteHabit,
} = require("../controllers/habitController");
const protect = require("../utils/protect");

const router = express.Router();

// ─── Public Routes ──────────────────────────────────────────────────────────
// (None)

// ─── Protected Routes ────────────────────────────────────────────────────────
router.use(protect);

// GET all habits
router.get("/", getHabits);

// GET habits by goal
router.get("/goal/:goalId", getHabitsByGoal);

// GET single habit
router.get("/:id", getHabit);

// POST create habit
router.post("/", createHabit);

// PUT update habit
router.put("/:id", updateHabit);

// PATCH complete habit (mark today as complete)
router.patch("/:id/complete", completeHabit);

// PATCH reset habit (clear all tracking)
router.patch("/:id/reset", resetHabit);

// PATCH link habit to goal
router.patch("/:id/link", linkHabitToGoal);

// PATCH unlink habit from goal ✅ NEW
router.patch("/:id/unlink", unlinkHabitFromGoal);

// DELETE habit
router.delete("/:id", deleteHabit);

module.exports = router;
