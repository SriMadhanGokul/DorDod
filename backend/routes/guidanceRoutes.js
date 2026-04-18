const express = require("express");
const router = express.Router();
const {
  startSession,
  sendMessage,
  getTodaySession,
  getHistory,
  completeSession,
} = require("../controllers/guidanceController");
const protect = require("../utils/protect");
router.use(protect);
router.get("/today", getTodaySession);
router.get("/history", getHistory);
router.post("/start", startSession);
router.post("/message", sendMessage);
router.post("/complete", completeSession);
module.exports = router;
