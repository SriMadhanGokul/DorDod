const express = require("express");
const router = express.Router();
const {
  getGoals,
  createGoal,
  activateGoal,
  deactivateGoal,
  completeDayActivity,
  updateGoal,
  deleteGoal,
  pauseDay,
} = require("../controllers/goalController");
const protect = require("../utils/protect");

router.use(protect);
router.get("/", getGoals);
router.post("/", createGoal);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.patch("/:id/activate", activateGoal);
router.patch("/:id/deactivate", deactivateGoal);
router.patch("/:id/day/:dayNumber/complete", completeDayActivity);
router.patch("/:id/day/:dayNumber/pause", pauseDay);

module.exports = router;
