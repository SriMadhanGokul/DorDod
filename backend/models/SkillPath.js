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

const careerPathEntrySchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId, // MongoDB will generate this
    careerPath: { type: String, required: true }, // e.g., "Full Stack Developer"
    careerId: { type: String, required: true }, // e.g., "full-stack"
    skills: { type: [userSkillSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
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
    // ✅ Array of all career paths user has selected
    paths: {
      type: [careerPathEntrySchema],
      default: [],
    },
    // ✅ Track which path is currently active
    activePath: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // Will be set to a path._id
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SkillPath", skillPathSchema);
