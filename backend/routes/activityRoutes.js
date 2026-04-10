const express = require("express");
const router = express.Router();
const {
  getActivities,
  getActivitySuggestions,
  createActivity,
  updateStatus,
  addToHabit,
  addToAchievement,
  deleteActivity,
} = require("../controllers/activityController");
const protect = require("../utils/protect");

router.use(protect);

router.get("/", getActivities);
router.get("/suggestions/:goalId", getActivitySuggestions);
router.post("/", createActivity);
router.patch("/:id/status", updateStatus);
router.post("/:id/add-habit", addToHabit);
router.post("/:id/add-achievement", addToAchievement);
router.delete("/:id", deleteActivity);

module.exports = router;
