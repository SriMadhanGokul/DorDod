const mongoose = require("mongoose");

const emergencyFundSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    target: { type: Number, default: 300000, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EmergencyFund", emergencyFundSchema);
