const mongoose = require("mongoose");

const userSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["learned", "learning", "to-learn"],
      default: "to-learn",
    },
    category: { type: String, default: "" },
    addedToGoal: { type: Boolean, default: false }, // true after added to Goals
  },
  { _id: true },
);

const skillPathSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    careerPath: { type: String, default: "" },
    skills: { type: [userSkillSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SkillPath", skillPathSchema);
