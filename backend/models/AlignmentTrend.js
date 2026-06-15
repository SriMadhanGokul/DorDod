// backend/models/AlignmentTrend.js
const mongoose = require("mongoose");

const alignmentTrendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dailyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    thirtyDayAverage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    sevenDayAverage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

alignmentTrendSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("AlignmentTrend", alignmentTrendSchema);
