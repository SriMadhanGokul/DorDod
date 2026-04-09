const mongoose = require("mongoose");

// Each "want to learn" tag can be individually added as a goal
const wantsToLearnItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    addedToGoal: { type: Boolean, default: false },
  },
  { _id: true },
);

const customSkillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName: { type: String, required: true, trim: true },
    alreadyKnows: { type: [String], default: [] }, // array of tag strings
    wantsToLearn: { type: [wantsToLearnItemSchema], default: [] }, // array with addedToGoal per item
    description: { type: String, default: "" },
    category: { type: String, default: "Technical" },
    status: {
      type: String,
      enum: ["current", "completed", "planned"],
      default: "current",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CustomSkill", customSkillSchema);
