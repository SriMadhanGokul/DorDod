const express = require("express");
const router = express.Router();
const {
  getHabits,
  createHabit,
  toggleDay,
  deleteHabit,
} = require("../controllers/habitController");
const protect = require("../utils/protect");

router.use(protect);

router.route("/").get(getHabits).post(createHabit);
router.route("/:id").delete(deleteHabit);
router.patch("/:id/toggle/:dayIndex", toggleDay);

module.exports = router;
