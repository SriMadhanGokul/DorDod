const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "On Hold", "Completed"],
      default: "Not Started",
    },
    linkedGoal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },
    dueDate: { type: Date },
    updates: [
      { text: { type: String }, createdAt: { type: Date, default: Date.now } },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Activity", activitySchema);
