const mongoose = require("mongoose");

const DailyReflectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date().toISOString().split("T")[0],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a reflection title"],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, "Please write your reflection"],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    completed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Ensure one reflection per user per day
DailyReflectionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyReflection", DailyReflectionSchema);
