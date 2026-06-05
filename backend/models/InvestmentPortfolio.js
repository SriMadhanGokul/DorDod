const mongoose = require("mongoose");

const investmentPortfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  investments: [
    {
      name: String,
      type: {
        type: String,
        enum: [
          "Mutual Fund",
          "Index Fund",
          "PPF",
          "NPS",
          "Stock",
          "Gold",
          "Bond",
          "Other",
        ],
      },
      amount: Number,
      currentValue: Number,
      investmentDate: Date,
      returns: Number,
      riskProfile: { type: String, enum: ["Low", "Medium", "High"] },
    },
  ],
  totalInvested: { type: Number, default: 0 },
  totalCurrentValue: { type: Number, default: 0 },
  totalReturns: { type: Number, default: 0 },
  riskProfile: {
    type: String,
    enum: ["Conservative", "Moderate", "Aggressive"],
    default: "Moderate",
  },
  monthlyInvestment: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "InvestmentPortfolio",
  investmentPortfolioSchema,
);
