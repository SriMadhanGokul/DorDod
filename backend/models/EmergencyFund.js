const mongoose = require("mongoose");

const emergencyFundSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  target: {
    type: Number,
    default: 300000,
    min: 0,
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ["add", "withdraw"],
      },
      amount: Number,
      date: {
        type: Date,
        default: Date.now,
      },
      description: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

emergencyFundSchema.index({ userId: 1 });

module.exports = mongoose.model("EmergencyFund", emergencyFundSchema);
