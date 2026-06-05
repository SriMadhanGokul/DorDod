const mongoose = require("mongoose");

const salaryAllocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  monthlySalary: {
    type: Number,
    required: true,
    min: 0,
  },
  essentials: {
    type: Number,
    default: 0,
  },
  savings: {
    type: Number,
    default: 0,
  },
  emergencyFund: {
    type: Number,
    default: 0,
  },
  lifestyle: {
    type: Number,
    default: 0,
  },
  investments: {
    type: Number,
    default: 0,
  },
  debt: {
    type: Number,
    default: 0,
  },
  planType: {
    type: String,
    enum: ["50/30/20", "aggressive", "debt-focused", "lifestyle", "custom"],
    default: "custom",
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

salaryAllocationSchema.index({ userId: 1 });

module.exports = mongoose.model("SalaryAllocation", salaryAllocationSchema);
