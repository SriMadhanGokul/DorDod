const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const dailyCheckInController = require("../controllers/dailyCheckInController");

// Get all check-ins
router.get("/", protect, dailyCheckInController.getCheckIns);

// ✅ Get TODAY'S check-in
router.get("/today", protect, dailyCheckInController.getCheckInToday);

// Get single check-in
router.get("/:id", protect, dailyCheckInController.getCheckIn);

// Create check-in
router.post("/", protect, dailyCheckInController.createCheckIn);

// Update check-in
router.put("/:id", protect, dailyCheckInController.updateCheckIn);

// Delete check-in
router.delete("/:id", protect, dailyCheckInController.deleteCheckIn);

module.exports = router;
