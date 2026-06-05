const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");

const {
  getExpenses,
  getExpenseSummary,
  getMonthlyTrend,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

router.use(protect);

router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);
router.get("/trend/monthly", getMonthlyTrend);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
