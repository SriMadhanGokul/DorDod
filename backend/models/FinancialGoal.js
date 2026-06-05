const mongoose = require("mongoose");

const financialGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "House",
      "Car",
      "Marriage",
      "Education",
      "Vacation",
      "Business",
      "Other",
    ],
    required: true,
  },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  monthlyAllocation: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started",
  },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FinancialGoal", financialGoalSchema);
