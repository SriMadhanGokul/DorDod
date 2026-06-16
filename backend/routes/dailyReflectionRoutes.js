const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const dailyReflectionController = require("../controllers/dailyReflectionController");

// Get all reflections
router.get("/", protect, dailyReflectionController.getReflections);

// ✅ Get TODAY'S reflection
router.get("/today", protect, dailyReflectionController.getReflectionToday);

// Get single reflection
router.get("/:id", protect, dailyReflectionController.getReflection);

// Create reflection
router.post("/", protect, dailyReflectionController.createReflection);

// Update reflection
router.put("/:id", protect, dailyReflectionController.updateReflection);

// Delete reflection
router.delete("/:id", protect, dailyReflectionController.deleteReflection);

module.exports = router;
