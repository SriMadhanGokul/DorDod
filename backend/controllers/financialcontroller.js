const Expense = require("../models/Expense");
const SalaryAllocation = require("../models/SalaryAllocation");
const EmergencyFund = require("../models/EmergencyFund");
const axios = require("axios");

// ─── EXPENSE ENDPOINTS ───────────────────────────────────────────────────────

exports.addExpense = async (req, res) => {
  try {
    const { category, salaryCategory, amount, description, date } = req.body;
    const userId = req.userId;

    // Validation
    if (!category || !salaryCategory || !amount) {
      return res.status(400).json({
        success: false,
        error: "Category, salaryCategory, and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than 0",
      });
    }

    // Create expense
    const expense = new Expense({
      userId,
      category,
      salaryCategory,
      amount: Number(amount),
      description: description || "",
      date: date ? new Date(date) : new Date(),
    });

    await expense.save();

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    let filter = { userId };

    // Optional: Filter by month and year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.userId;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    if (expense.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized",
      });
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({
      success: true,
      message: "Expense deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ─── SALARY ALLOCATION ENDPOINTS ────────────────────────────────────────────

exports.saveSalaryAllocation = async (req, res) => {
  try {
    const {
      monthlySalary,
      essentials,
      savings,
      emergencyFund,
      lifestyle,
      investments,
      debt,
      planType,
    } = req.body;
    const userId = req.userId;

    // Validation
    if (!monthlySalary || monthlySalary <= 0) {
      return res.status(400).json({
        success: false,
        error: "Monthly salary must be greater than 0",
      });
    }

    // Check if allocation totals 100%
    const total =
      (essentials || 0) +
      (savings || 0) +
      (emergencyFund || 0) +
      (lifestyle || 0) +
      (investments || 0) +
      (debt || 0);

    const calculatedTotal = (total / monthlySalary) * 100;

    if (Math.abs(calculatedTotal - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Allocation must total 100%. Currently: ${calculatedTotal.toFixed(2)}%`,
      });
    }

    // Find or create salary allocation
    let allocation = await SalaryAllocation.findOne({ userId });

    if (allocation) {
      // Update existing
      allocation.monthlySalary = monthlySalary;
      allocation.essentials = essentials || 0;
      allocation.savings = savings || 0;
      allocation.emergencyFund = emergencyFund || 0;
      allocation.lifestyle = lifestyle || 0;
      allocation.investments = investments || 0;
      allocation.debt = debt || 0;
      allocation.planType = planType || "custom";
      allocation.updatedAt = new Date();
    } else {
      // Create new
      allocation = new SalaryAllocation({
        userId,
        monthlySalary,
        essentials: essentials || 0,
        savings: savings || 0,
        emergencyFund: emergencyFund || 0,
        lifestyle: lifestyle || 0,
        investments: investments || 0,
        debt: debt || 0,
        planType: planType || "custom",
      });
    }

    await allocation.save();

    res.json({
      success: true,
      data: allocation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getSalaryAllocation = async (req, res) => {
  try {
    const userId = req.userId;

    const allocation = await SalaryAllocation.findOne({ userId });

    if (!allocation) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: allocation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ─── EMERGENCY FUND ENDPOINTS ───────────────────────────────────────────────

exports.updateEmergencyFund = async (req, res) => {
  try {
    const { balance, target } = req.body;
    const userId = req.userId;

    // Validation
    if (balance === undefined || balance < 0) {
      return res.status(400).json({
        success: false,
        error: "Balance must be a positive number",
      });
    }

    // Find or create emergency fund
    let fund = await EmergencyFund.findOne({ userId });

    if (fund) {
      fund.balance = balance;
      if (target !== undefined) {
        fund.target = target;
      }
      fund.updatedAt = new Date();

      // Add transaction record
      fund.transactions.push({
        type: balance > fund.balance ? "add" : "withdraw",
        amount: Math.abs(balance - fund.balance),
        date: new Date(),
        description: "Balance update",
      });
    } else {
      fund = new EmergencyFund({
        userId,
        balance,
        target: target || 300000,
      });
    }

    await fund.save();

    res.json({
      success: true,
      data: {
        balance: fund.balance,
        target: fund.target,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getEmergencyFund = async (req, res) => {
  try {
    const userId = req.userId;

    let fund = await EmergencyFund.findOne({ userId });

    // Create if doesn't exist
    if (!fund) {
      fund = new EmergencyFund({
        userId,
        balance: 0,
        target: 300000,
      });
      await fund.save();
    }

    res.json({
      success: true,
      data: {
        balance: fund.balance,
        target: fund.target,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ─── AI COACH ENDPOINT ──────────────────────────────────────────────────────

exports.getFinancialAdvice = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.userId;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required",
      });
    }

    // Get user's financial data for context
    const [allocation, expenses, fund] = await Promise.all([
      SalaryAllocation.findOne({ userId }),
      Expense.find({ userId }).limit(10),
      EmergencyFund.findOne({ userId }),
    ]);

    // Build context for AI
    const context = {
      salary: allocation?.monthlySalary || 0,
      essentials: allocation?.essentials || 0,
      savings: allocation?.savings || 0,
      investments: allocation?.investments || 0,
      emergencyFund: fund?.balance || 0,
      recentExpenses: expenses.slice(0, 5),
    };

    // Call Claude API for financial advice
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-opus-4-6",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `You are a financial advisor. Based on this user's financial data: ${JSON.stringify(context)}, answer this question: ${query}. Provide practical, actionable advice in 2-3 sentences.`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      },
    );

    const advice =
      response.data.content[0]?.text ||
      "Unable to generate advice at this time.";

    res.json({
      success: true,
      data: {
        advice,
      },
    });
  } catch (error) {
    // Fallback response if API call fails
    res.json({
      success: true,
      data: {
        advice:
          "Based on your financial data, consider creating a monthly budget, building an emergency fund of 3-6 months expenses, and investing 15-20% of your income for long-term growth.",
      },
    });
  }
};

// ─── FINANCIAL HEALTH SCORE ────────────────────────────────────────────────

exports.getFinancialHealth = async (req, res) => {
  try {
    const userId = req.userId;

    const [allocation, expenses, fund] = await Promise.all([
      SalaryAllocation.findOne({ userId }),
      Expense.find({ userId }),
      EmergencyFund.findOne({ userId }),
    ]);

    if (!allocation) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const monthlySalary = allocation.monthlySalary;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const savingsAmount = allocation.savings + allocation.investments;
    const emergencyBalance = fund?.balance || 0;

    // Calculate health score (0-100)
    let score = 50; // Base score

    // Emergency fund score (0-20)
    const emergencyScore = Math.min((emergencyBalance / 300000) * 20, 20);
    score += emergencyScore;

    // Savings rate score (0-20)
    const savingsRate = (savingsAmount / monthlySalary) * 100;
    const savingsScore = Math.min((savingsRate / 30) * 20, 20);
    score += savingsScore;

    // Spending control score (0-20)
    const spendingRate = (totalExpenses / monthlySalary) * 100;
    const spendingScore = Math.max(20 - spendingRate / 5, 0);
    score += spendingScore;

    // Determine level
    let level = "Poor";
    if (score >= 80) level = "Excellent";
    else if (score >= 60) level = "Good";
    else if (score >= 40) level = "Fair";

    res.json({
      success: true,
      data: {
        score: Math.round(score),
        level,
        emergencyFundStatus: emergencyBalance,
        savingsRate: Math.round(savingsRate),
        debtRatio: allocation.debt / monthlySalary,
        investmentConsistency: allocation.investments / monthlySalary,
        goalProgress: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
