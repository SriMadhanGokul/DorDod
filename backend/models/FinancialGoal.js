const mongoose = require("mongoose");

const financialGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
  },
  { timestamps: true },
);

financialGoalSchema.index({ user: 1 });

module.exports = mongoose.model("FinancialGoal", financialGoalSchema);
