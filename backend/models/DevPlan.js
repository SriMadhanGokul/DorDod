const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: String, required: true },
    completed: { type: Boolean, default: false },
    icon: { type: String, default: "FaBook" },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    reason: { type: String, default: "" },
  },
  { _id: true },
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String, required: true },
    done: { type: Boolean, default: false },
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
