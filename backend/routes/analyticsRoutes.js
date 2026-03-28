const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../controllers/analyticsController");
const protect = require("../utils/protect");

router.use(protect);
router.get("/", getAnalytics);

module.exports = router;
