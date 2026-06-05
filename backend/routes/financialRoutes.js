const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const financialController = require("../controllers/financialController");

// Middleware to require authentication
router.use(auth);

// ─── EXPENSE ROUTES ─────────────────────────────────────────────────────────
router.post("/expenses", financialController.addExpense);
router.get("/expenses", financialController.getExpenses);
router.delete("/expenses/:expenseId", financialController.deleteExpense);

// ─── SALARY ALLOCATION ROUTES ───────────────────────────────────────────────
router.post("/salary-allocation", financialController.saveSalaryAllocation);
router.get("/salary-allocation", financialController.getSalaryAllocation);

// ─── EMERGENCY FUND ROUTES ──────────────────────────────────────────────────
router.post("/emergency-fund", financialController.updateEmergencyFund);
router.get("/emergency-fund", financialController.getEmergencyFund);

// ─── AI COACH ROUTE ─────────────────────────────────────────────────────────
router.post("/ai-coach", financialController.getFinancialAdvice);

// ─── FINANCIAL HEALTH ROUTE ────────────────────────────────────────────────
router.get("/health", financialController.getFinancialHealth);

module.exports = router;
