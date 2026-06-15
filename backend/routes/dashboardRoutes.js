const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const protect = require("../utils/protect");

// ─── Dashboard Routes ────────────────────────────────────────────────────────

// GET /api/dashboard/metrics - Get all dashboard metrics
router.get("/metrics", protect, dashboardController.getDashboardMetrics);

// GET /api/dashboard/stats - Get quick stats
router.get("/stats", protect, dashboardController.getQuickStats);

module.exports = router;
