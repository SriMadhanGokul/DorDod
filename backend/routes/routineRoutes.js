const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  completeRoutine,
  applyPenalties,
  getLeaderboard,
  getSummary,
} = require("../controllers/routineController");

router.use(protect);

router.get("/leaderboard", getLeaderboard);
router.get("/summary", getSummary);
router.get("/", getRoutines);
router.post("/", createRoutine);
router.put("/:id", updateRoutine);
router.delete("/:id", deleteRoutine);
router.patch("/:id/complete", completeRoutine);
router.post("/apply-penalties", applyPenalties);

module.exports = router;
