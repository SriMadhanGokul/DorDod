const express = require("express");
const router = express.Router();
const {
  getAchievements,
  createAchievement,
  deleteAchievement,
} = require("../controllers/achievementController");
const protect = require("../utils/protect");
router.use(protect);
router.route("/").get(getAchievements).post(createAchievement);
router.delete("/:id", deleteAchievement);
module.exports = router;
