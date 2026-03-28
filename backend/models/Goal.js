const mongoose = require("mongoose");

const subGoalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startDate: { type: Date },
    expectedDueDate: { type: Date },
    weightage: { type: Number, default: 0 },
    measurementCriteria: { type: String, default: "" },
    requiredEffort: { type: Number, default: 0 },
    utilizedEffort: { type: Number, default: 0 },
    spentEffort: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "On Hold"],
      default: "Not Started",
    },
    actualCompletionDate: { type: Date },
    accomplishment: { type: String, default: "" },
  },
  { timestamps: true },
);

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goalType: {
      type: String,
      enum: ["Personal", "Professional"],
      default: "Personal",
    },
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
      default: "Other",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 100,
    },
    description: { type: String, default: "", maxlength: 500 },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    expectedDueDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
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
    tags: { type: [String], default: [] },
    effortRequired: { type: Number, default: 0 },
    weightage: { type: Number, default: 0 },
    measurementCriteria: { type: String, default: "" },
    accomplishment: { type: String, default: "" },
    coach: { type: String, default: "" },
    actualCompletionDate: { type: Date },
    subGoals: { type: [subGoalSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Goal", goalSchema);
