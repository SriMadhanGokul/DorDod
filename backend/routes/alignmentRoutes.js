const express = require("express");
const protect = require("../utils/protect");
const {
  updateTodayScore,
  getTodayScore,
  getHistory,
  getStats,
} = require("../controllers/alignmentController");

const router = express.Router();

// ✅ All routes are protected
router.use(protect);

// GET today's alignment score
router.get("/today", getTodayScore);

// UPDATE today's alignment score (recalculate all metrics)
router.patch("/today", updateTodayScore);

// GET alignment history (last 30 days)
router.get("/history", getHistory);

// GET alignment stats (averages, totals)
router.get("/stats", getStats);

module.exports = router;
