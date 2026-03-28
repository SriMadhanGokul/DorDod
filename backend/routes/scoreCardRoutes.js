const express = require("express");
const router = express.Router();
const {
  getMyScoreCard,
  giveScore,
  getUsers,
} = require("../controllers/scoreCardController");
const protect = require("../utils/protect");
router.use(protect);
router.get("/", getMyScoreCard);
router.get("/users", getUsers);
router.post("/give/:userId", giveScore);
module.exports = router;
