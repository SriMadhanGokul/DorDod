const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");

// Import controller functions
const dashboardController = require("../controllers/dashboardController");

console.log(
  "📌 Dashboard Routes - Controller exports:",
  Object.keys(dashboardController),
);

// Routes
router.get("/metrics", protect, dashboardController.getDashboardMetrics);
router.get("/stats", protect, dashboardController.getDashboardStats);

module.exports = router;
