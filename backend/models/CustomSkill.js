const mongoose = require("mongoose");

const customSkillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skillName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true, // ✅ MANDATORY
    },
    category: {
      type: String,
      required: true, // ✅ MANDATORY
      enum: [
        "Technical",
        "Leadership",
        "Soft Skills",
        "Creative",
        "Language",
        "Other",
      ],
    },
    status: {
      type: String,
      enum: ["to-learn", "learning", "learned"],
      default: "to-learn",
      required: true,
    },
    // ✅ NEW - Link to goal (for goal integration)
    linkedGoal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CustomSkill", customSkillSchema);
