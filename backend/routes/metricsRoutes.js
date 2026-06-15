// backend/routes/metricsRoutes.js
const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");

// All routes require authentication (use protect middleware in server.js)

// GET today's daily metrics
router.get("/daily", metricsController.getDailyMetrics);

// GET alignment trend (30 days)
router.get("/trend", metricsController.getAlignmentTrend);

// GET growth score
router.get("/growth", metricsController.getGrowthScore);

// GET all dashboard metrics (one call gets everything)
router.get("/dashboard", metricsController.getDashboardMetrics);

// POST calculate/recalculate alignment score
// Called after goal/habit/reflection completion
router.post("/calculate-alignment", async (req, res) => {
  const result = await metricsController.calculateAlignmentScore(req.user.id);
  res.json(result);
});

// POST calculate/recalculate alignment trend
router.post("/calculate-trend", async (req, res) => {
  const result = await metricsController.calculateAlignmentTrend(req.user.id);
  res.json(result);
});

// POST calculate/recalculate growth score
router.post("/calculate-growth", async (req, res) => {
  const result = await metricsController.calculateGrowthScore(req.user.id);
  res.json(result);
});

module.exports = router;
