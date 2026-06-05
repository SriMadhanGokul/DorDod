const mongoose = require("mongoose");

const debtManagementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  debts: [
    {
      name: String,
      type: {
        type: String,
        enum: [
          "Credit Card",
          "Personal Loan",
          "Home Loan",
          "Car Loan",
          "Student Loan",
          "Other",
        ],
      },
      principal: Number,
      currentBalance: Number,
      interestRate: Number,
      monthlyEMI: Number,
      dueDate: Date,
      status: { type: String, enum: ["Active", "Paid Off"] },
    },
  ],
  totalDebt: { type: Number, default: 0 },
  totalMonthlyEMI: { type: Number, default: 0 },
  debtToIncomeRatio: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DebtManagement", debtManagementSchema);
