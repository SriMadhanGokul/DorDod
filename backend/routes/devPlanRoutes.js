const express = require("express");
const router = express.Router();
const {
  getDevPlan,
  toggleRecommendation,
  toggleMilestone,
} = require("../controllers/devPlanController");
const protect = require("../utils/protect");

router.use(protect);

router.get("/", getDevPlan);
router.patch("/recommendations/:recId/toggle", toggleRecommendation);
router.patch("/milestones/:milestoneId/toggle", toggleMilestone);

module.exports = router;
