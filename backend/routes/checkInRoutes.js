const express = require("express");
const router = express.Router();
const {
  getTodayCheckIn,
  getDashboardInsights,
  createCheckIn,
  saveRealization,
  postGuidanceUpdate,
  getRealizations,
  getScoreHistory,
  getSlotStatus,
} = require("../controllers/dailyCheckInController");
const protect = require("../utils/protect");
router.use(protect);

router.get("/today", getTodayCheckIn);
router.get("/dashboard", getDashboardInsights);
router.get("/realizations", getRealizations);
router.get("/history", getScoreHistory);
router.get("/slot-status", getSlotStatus);
router.post("/", createCheckIn);
router.patch("/realization", saveRealization);
router.post("/guidance-update", postGuidanceUpdate);

module.exports = router;
