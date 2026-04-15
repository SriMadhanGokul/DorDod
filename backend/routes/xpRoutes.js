const express = require("express");
const router = express.Router();
const {
  getMyScore,
  getMyHistory,
  getLeaderboard,
  awardXPEndpoint,
} = require("../controllers/xpController");
const protect = require("../utils/protect");

router.use(protect);
router.get("/me", getMyScore);
router.get("/history", getMyHistory);
router.get("/leaderboard", getLeaderboard);
router.post("/award", awardXPEndpoint);

module.exports = router;
