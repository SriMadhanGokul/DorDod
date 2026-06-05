const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true }, // free text: "Groceries", "Fuel"
    salaryCategory: {
      // which salary bucket it draws from
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
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

expenseSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
