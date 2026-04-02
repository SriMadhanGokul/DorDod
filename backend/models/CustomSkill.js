const mongoose = require("mongoose");

const customSkillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName: { type: String, required: true, trim: true },
    alreadyKnows: { type: String, default: "" },
    wantsToLearn: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "Other" },
    status: {
      type: String,
      enum: ["current", "completed", "planned"],
      default: "current",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CustomSkill", customSkillSchema);
