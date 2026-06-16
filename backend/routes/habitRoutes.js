const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const habitController = require("../controllers/habitController");

// Get all habits
router.get("/", protect, habitController.getHabits);

// Get single habit
router.get("/:id", protect, habitController.getHabit);

// Create habit
router.post("/", protect, habitController.createHabit);

// Update habit
router.put("/:id", protect, habitController.updateHabit);

// Delete habit
router.delete("/:id", protect, habitController.deleteHabit);

// ✅ Mark habit complete (PATCH - frontend sends PATCH)
router.patch("/:id/complete", protect, habitController.markHabitComplete);

// Mark habit incomplete
router.patch("/:id/incomplete", protect, habitController.markHabitIncomplete);

// Link habit to goal
router.patch("/:id/link", protect, habitController.linkHabitToGoal);

// Unlink habit from goal
router.patch("/:id/unlink", protect, habitController.unlinkHabitFromGoal);

module.exports = router;
