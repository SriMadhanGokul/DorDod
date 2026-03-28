const express = require("express");
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addSubGoal,
  updateSubGoal,
  deleteSubGoal,
} = require("../controllers/goalController");
const protect = require("../utils/protect");

router.use(protect);

router.route("/").get(getGoals).post(createGoal);
router.route("/:id").put(updateGoal).delete(deleteGoal);
router.route("/:id/subgoals").post(addSubGoal);
router.route("/:id/subgoals/:subId").put(updateSubGoal).delete(deleteSubGoal);

module.exports = router;
