const SalaryAllocation = require("../models/SalaryAllocation");
const Expense = require("../models/Expense");
const EmergencyFund = require("../models/EmergencyFund");
const FinancialGoal = require("../models/FinancialGoal");

// NOTE: this controller uses req.user.id to match your profileController.
// Your `protect` middleware must set req.user. (It does, since profile works.)

// ─── SALARY ALLOCATION ───────────────────────────────────────────────────────
const getSalaryAllocation = async (req, res) => {
  try {
    const allocation = await SalaryAllocation.findOne({ user: req.user.id });
    res.status(200).json({ success: true, data: allocation });
  } catch (err) {
    console.error("getSalaryAllocation error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load salary plan" });
  }
};

const saveSalaryAllocation = async (req, res) => {
  try {
    const { monthlySalary, selectedPlan, categories } = req.body;

    const allocation = await SalaryAllocation.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        monthlySalary: monthlySalary || 0,
        selectedPlan: selectedPlan || null,
        categories: Array.isArray(categories) ? categories : [],
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(200).json({ success: true, data: allocation });
  } catch (err) {
    console.error("saveSalaryAllocation error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save salary plan" });
  }
};

// ─── EXPENSES ──────────────────────────────────────────────────────────────────
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.status(200).json({ success: true, data: expenses });
  } catch (err) {
    console.error("getExpenses error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load expenses" });
  }
};

const addExpense = async (req, res) => {
  try {
    const { category, salaryCategory, amount, description, date } = req.body;

    if (!category || !salaryCategory || !amount) {
      return res.status(400).json({
        success: false,
        message: "Category, salaryCategory, and amount are required",
      });
    }

    const expense = await Expense.create({
      user: req.user.id,
      category,
      salaryCategory,
      amount: Number(amount),
      description: description || "",
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    console.error("addExpense error:", err);
    res.status(500).json({ success: false, message: "Failed to add expense" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.expenseId,
      user: req.user.id,
    });
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    await expense.deleteOne();
    res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (err) {
    console.error("deleteExpense error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete expense" });
  }
};

// ─── EMERGENCY FUND ────────────────────────────────────────────────────────────
const getEmergencyFund = async (req, res) => {
  try {
    let fund = await EmergencyFund.findOne({ user: req.user.id });
    if (!fund) fund = await EmergencyFund.create({ user: req.user.id });
    res.status(200).json({
      success: true,
      data: { balance: fund.balance, target: fund.target },
    });
  } catch (err) {
    console.error("getEmergencyFund error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load emergency fund" });
  }
};

const updateEmergencyFund = async (req, res) => {
  try {
    const { balance, target } = req.body;
    const update = { user: req.user.id };
    if (balance !== undefined) update.balance = balance;
    if (target !== undefined) update.target = target;

    const fund = await EmergencyFund.findOneAndUpdate(
      { user: req.user.id },
      update,
      { new: true, upsert: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      data: { balance: fund.balance, target: fund.target },
    });
  } catch (err) {
    console.error("updateEmergencyFund error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update emergency fund" });
  }
};

// ─── FINANCIAL GOALS ───────────────────────────────────────────────────────────
const getGoals = async (req, res) => {
  try {
    const goals = await FinancialGoal.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: goals });
  } catch (err) {
    console.error("getGoals error:", err);
    res.status(500).json({ success: false, message: "Failed to load goals" });
  }
};

const addGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, currentAmount } = req.body;
    if (!name || !targetAmount) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name and target amount are required",
        });
    }

    const goal = await FinancialGoal.create({
      user: req.user.id,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline ? new Date(deadline) : undefined,
    });

    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    console.error("addGoal error:", err);
    res.status(500).json({ success: false, message: "Failed to add goal" });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await FinancialGoal.findOne({
      _id: req.params.goalId,
      user: req.user.id,
    });
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });

    await goal.deleteOne();
    res.status(200).json({ success: true, message: "Goal deleted" });
  } catch (err) {
    console.error("deleteGoal error:", err);
    res.status(500).json({ success: false, message: "Failed to delete goal" });
  }
};

// ─── AI COACH ───────────────────────────────────────────────────────────────────
// Safe fallback version: no external API dependency, so it never crashes the route.
const getFinancialAdvice = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Query is required" });
    }

    const [allocation, fund, expenses] = await Promise.all([
      SalaryAllocation.findOne({ user: req.user.id }),
      EmergencyFund.findOne({ user: req.user.id }),
      Expense.find({ user: req.user.id }),
    ]);

    const salary = allocation?.monthlySalary || 0;
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const emergencyBalance = fund?.balance || 0;

    let advice =
      "Track your spending against each salary category and aim to keep essentials under 50% of income.";

    if (salary > 0) {
      const spendPct = Math.round((totalSpent / salary) * 100);
      if (emergencyBalance < salary * 3) {
        advice = `You've spent about ${spendPct}% of your salary so far. Your emergency fund is below 3 months of income — prioritise building it before increasing discretionary spending.`;
      } else if (spendPct > 70) {
        advice = `Your spending is at ${spendPct}% of salary, which is high. Review lifestyle and essentials categories to find areas to cut back.`;
      } else {
        advice = `You're spending around ${spendPct}% of your salary and your emergency fund is healthy. Consider directing surplus toward investments and your financial goals.`;
      }
    }

    res.status(200).json({ success: true, data: { advice } });
  } catch (err) {
    console.error("getFinancialAdvice error:", err);
    res.status(200).json({
      success: true,
      data: {
        advice:
          "Build a 3–6 month emergency fund, keep essentials under 50% of income, and invest 15–20% consistently.",
      },
    });
  }
};

module.exports = {
  getSalaryAllocation,
  saveSalaryAllocation,
  getExpenses,
  addExpense,
  deleteExpense,
  getEmergencyFund,
  updateEmergencyFund,
  getGoals,
  addGoal,
  deleteGoal,
  getFinancialAdvice,
};
