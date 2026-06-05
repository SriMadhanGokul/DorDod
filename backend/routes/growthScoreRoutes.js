const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const { getGrowthScore } = require("../controllers/growthScoreController");

router.use(protect);
router.get("/", getGrowthScore);

module.exports = router;
