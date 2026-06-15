const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const {
  getTodayReflection,
  createReflection,
  getReflectionHistory,
  getReflection,
  deleteReflection,
  getReflectionStats,
} = require("../controllers/dailyReflectionController");

// ✅ GET today's reflection
router.get("/today", protect, getTodayReflection);

// ✅ GET reflection history (last 30 days)
router.get("/history", protect, getReflectionHistory);

// ✅ GET reflection stats
router.get("/stats", protect, getReflectionStats);

// ✅ GET single reflection
router.get("/:id", protect, getReflection);

// ✅ CREATE/UPDATE reflection
router.post("/", protect, createReflection);

// ✅ DELETE reflection
router.delete("/:id", protect, deleteReflection);

module.exports = router;
