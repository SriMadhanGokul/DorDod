const express = require("express");
const router = express.Router();
const {
  getDevPlan,
  refreshPlan,
  addRecommendation,
  updateRecommendation,
  deleteRecommendation,
  toggleRecommendation,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  toggleMilestone,
} = require("../controllers/devPlanController");
const protect = require("../utils/protect");

router.use(protect);

router.get("/", getDevPlan);
router.post("/refresh", refreshPlan);

// Recommendations CRUD
router.post("/recommendations", addRecommendation);
router.put("/recommendations/:recId", updateRecommendation);
router.delete("/recommendations/:recId", deleteRecommendation);
router.patch("/recommendations/:recId/toggle", toggleRecommendation);

// Milestones CRUD
router.post("/milestones", addMilestone);
router.put("/milestones/:milestoneId", updateMilestone);
router.delete("/milestones/:milestoneId", deleteMilestone);
router.patch("/milestones/:milestoneId/toggle", toggleMilestone);

module.exports = router;
