const mongoose = require("mongoose");

const dayActivitySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true }, // 1-21
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Upcoming", "Completed", "Missed", "Late"],
      default: "Upcoming",
    },
    completedAt: { type: Date, default: null },
  },
  { _id: true },
);

const subGoalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, default: "Not Started" },
    expectedDueDate: { type: Date },
    measurementCriteria: { type: String, default: "" },
  },
  { _id: true },
);

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "Spiritual",
        "Fitness",
        "Family",
        "Career",
        "Financial",
        "Social",
        "Intellectual",
        "Other",
      ],
      required: [true, "Category is required"],
    },
    goalType: {
      type: String,
      enum: ["Personal", "Professional"],
      default: "Personal",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "On Hold"],
      default: "Not Started",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    measurementCriteria: { type: String, default: "" },
    coach: { type: String, default: "" },
    // 21-day daily activity plan (only for In-Progress goals)
    dayActivities: { type: [dayActivitySchema], default: [] },
    planStartDate: { type: Date, default: null },
    subGoals: { type: [subGoalSchema], default: [] },
    tags: { type: [String], default: [] },
    icon: { type: String, default: "🎯" },
    color: { type: String, default: "#6366f1" },
  },
  { timestamps: true },
);

goalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Goal", goalSchema);
