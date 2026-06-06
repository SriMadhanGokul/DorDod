const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const financialController = require("../controllers/financialcontroller");

// All financial routes require authentication (same pattern as profileRoutes)
router.use(protect);

// ─── SALARY ALLOCATION ───────────────────────────────────────────────────────
router.get("/salary-allocation", financialController.getSalaryAllocation);
router.post("/salary-allocation", financialController.saveSalaryAllocation);

// ─── EXPENSES (linked to salary categories) ──────────────────────────────────
router.get("/expenses", financialController.getExpenses);
router.post("/expenses", financialController.addExpense);
router.delete("/expenses/:expenseId", financialController.deleteExpense);

// ─── EMERGENCY FUND ────────────────────────────────────────────────────────────
router.get("/emergency-fund", financialController.getEmergencyFund);
router.post("/emergency-fund", financialController.updateEmergencyFund);

// ─── FINANCIAL GOALS ───────────────────────────────────────────────────────────
router.get("/goals", financialController.getGoals);
router.post("/goals", financialController.addGoal);
router.delete("/goals/:goalId", financialController.deleteGoal);

// ─── AI COACH ───────────────────────────────────────────────────────────────────
router.post("/ai-coach", financialController.getFinancialAdvice);

module.exports = router;
