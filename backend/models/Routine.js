const mongoose = require("mongoose");

const completionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    completedAt: { type: Date, required: true },
    pointsEarned: { type: Number, default: 5 },
    timezone: { type: String, default: "UTC" },
  },
  { _id: false },
);

const routineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Time window — stored as "HH:MM" in 24h format
    scheduledStart: { type: String, required: true }, // e.g. "05:00"
    scheduledEnd: { type: String, required: true }, // e.g. "06:00"

    category: {
      type: String,
      enum: [
        "Health",
        "Fitness",
        "Learning",
        "Mindfulness",
        "Career",
        "Personal",
        "Social",
        "Other",
      ],
      default: "Personal",
    },
    icon: { type: String, default: "⭐" },
    color: { type: String, default: "#6366f1" },

    isActive: { type: Boolean, default: true },

    // Completion log
    completions: [completionSchema],

    // Streaks
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: String, default: null }, // 'YYYY-MM-DD'

    // Separate points from XP
    totalPoints: { type: Number, default: 0 },

    order: { type: Number, default: 0 }, // for custom sort
  },
  { timestamps: true },
);

// Index for fast daily lookups
routineSchema.index({ user: 1, isActive: 1 });
routineSchema.index({ user: 1, "completions.date": 1 });

module.exports = mongoose.model("Routine", routineSchema);
