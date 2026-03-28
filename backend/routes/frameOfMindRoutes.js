const express = require("express");
const router = express.Router();
const {
  getFrameOfMind,
  logMood,
} = require("../controllers/frameOfMindController");
const protect = require("../utils/protect");
router.use(protect);
router.route("/").get(getFrameOfMind).post(logMood);
module.exports = router;
