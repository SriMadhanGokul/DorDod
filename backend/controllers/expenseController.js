const Expense = require("../models/Expense");

// GET all expenses for user with optional filters
const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    let filter = { user: req.user.id };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + "T23:59:59Z");
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.status(200).json({ success: true, data: expenses });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch expenses" });
  }
};

// GET expense summary by category
const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let match = { user: new (require("mongoose").Types.ObjectId)(req.user.id) };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate + "T23:59:59Z");
    }

    const summary = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = summary.reduce((sum, item) => sum + item.total, 0);

    res
      .status(200)
      .json({ success: true, data: { summary, total: totalExpense } });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch summary" });
  }
};

// GET monthly expense trend
const getMonthlyTrend = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trend = await Expense.aggregate([
      {
        $match: {
          user: new (require("mongoose").Types.ObjectId)(req.user.id),
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({ success: true, data: trend });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch trend" });
  }
};

// CREATE new expense
const createExpense = async (req, res) => {
  try {
    const { category, amount, description, paymentMethod, date, tags } =
      req.body;

    if (!category || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Category and amount are required" });
    }

    const expense = await Expense.create({
      user: req.user.id,
      category,
      amount,
      description: description || "",
      paymentMethod: paymentMethod || "Cash",
      date: date ? new Date(date) : new Date(),
      tags: tags || [],
    });

    res.status(201).json({ success: true, data: expense });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create expense" });
  }
};

// UPDATE expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, paymentMethod, date, tags } =
      req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: id, user: req.user.id },
      {
        category,
        amount,
        description,
        paymentMethod,
        date: date ? new Date(date) : undefined,
        tags,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update expense" });
  }
};

// DELETE expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete expense" });
  }
};

module.exports = {
  getExpenses,
  getExpenseSummary,
  getMonthlyTrend,
  createExpense,
  updateExpense,
  deleteExpense,
};
