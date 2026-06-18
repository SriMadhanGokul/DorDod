const mongoose = require("mongoose");

const customSkillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Removed unique: true - users should be able to create multiple custom skills
    },
    skillName: {
      type: String,
      required: true,
    },
    alreadyKnows: {
      type: [String],
      default: [],
    },
    wantsToLearn: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Technical",
      enum: ["Technical", "Leadership", "Soft Skills", "Creative", "Language", "Other"],
    },
    // ✅ UNIFIED STATUS - same as existing skills
    status: {
      type: String,
      enum: ["to-learn", "learning", "learned"],
      default: "to-learn",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomSkill", customSkillSchema);