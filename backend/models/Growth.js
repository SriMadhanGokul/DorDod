// backend/models/Growth.js
const mongoose = require("mongoose");

const growthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Capabilities (0-50)
    capabilities: {
      skills: [String],
      certifications: [String],
      education: [String],
      languages: [String],
      experience: [String],
    },
    capabilitiesScore: {
      type: Number,
      min: 0,
      max: 50,
      default: 0,
    },
    // Achievements (0-50)
    achievements: {
      goalsCompleted: { type: Number, default: 0 },
      projectsCompleted: { type: Number, default: 0 },
      coursesFinished: { type: Number, default: 0 },
      milestonesReached: { type: Number, default: 0 },
      awards: [String],
    },
    achievementsScore: {
      type: Number,
      min: 0,
      max: 50,
      default: 0,
    },
    // Final Score
    growthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Growth", growthSchema);
