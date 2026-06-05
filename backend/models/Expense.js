const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  salaryCategory: {
    type: String,
    required: true,
    enum: [
      "essentials",
      "savings",
      "emergencyFund",
      "lifestyle",
      "investments",
      "debt",
    ],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, salaryCategory: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
