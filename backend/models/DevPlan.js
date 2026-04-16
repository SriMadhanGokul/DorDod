const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    icon: { type: String, default: "FaBook" },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    reason: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    linkedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    courseTitle: { type: String, default: "" },
  },
  { _id: true },
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String, default: "" },
    done: { type: Boolean, default: false },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { _id: true },
);

const devPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    recommendations: { type: [recommendationSchema], default: [] },
    milestones: { type: [milestoneSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DevPlan", devPlanSchema);
