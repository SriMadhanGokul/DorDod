// backend/models/Reflection.js
const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    mood: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
      default: "Neutral",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Index for efficient queries
reflectionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Reflection", reflectionSchema);
