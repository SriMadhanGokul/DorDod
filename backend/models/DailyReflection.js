const mongoose = require("mongoose");

const DailyReflectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // ✅ FIXED: Changed from Date to String (YYYY-MM-DD format)
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split("T")[0],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Reflection title required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Reflection content required"],
      trim: true,
    },
    mood: {
      type: String,
      enum: ["excellent", "good", "neutral", "difficult", "challenging"],
      default: "neutral",
    },
    keyTakeaway: {
      type: String,
      trim: true,
    },
    actionItems: [
      {
        item: {
          type: String,
          required: true,
        },
        dueDate: {
          type: String, // YYYY-MM-DD format
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
      },
    ],
    completed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// ✅ Ensure one reflection per user per day (now works with String dates)
DailyReflectionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyReflection", DailyReflectionSchema);