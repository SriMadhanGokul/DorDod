const mongoose = require("mongoose");

// Stores the full salary plan including the per-category breakdown
// so the frontend can rebuild the tracker exactly on reload.
const categorySchema = new mongoose.Schema(
  {
    key: String, // essentials, savings, emergencyFund, lifestyle, investments, debt
    label: String,
    percentage: Number,
    targetAmount: Number,
    color: String,
    icon: String,
  },
  { _id: false },
);

const salaryAllocationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    monthlySalary: { type: Number, default: 0 },
    selectedPlan: { type: String, default: null }, // plan1..plan4 or "custom"
    categories: [categorySchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("SalaryAllocation", salaryAllocationSchema);
