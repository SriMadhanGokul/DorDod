const express = require("express");
const router = express.Router();
const {
  getCapabilities,
  getCapabilitiesSummary,
} = require("../controllers/capabilityController");
const protect = require("../utils/protect");

router.use(protect);

// GET all capabilities with breakdown
router.get("/", getCapabilities);

// GET summary for dashboard
router.get("/summary", getCapabilitiesSummary);

module.exports = router;
