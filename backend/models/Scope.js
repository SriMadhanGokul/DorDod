const mongoose = require("mongoose");

// One SCOP worksheet per user (editable). 7 text fields:
// 4 section notes + 3 "awareness to action" fields.
const scopeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Four sections
    strengths: { type: String, default: "" },
    constraints: { type: String, default: "" },
    opportunities: { type: String, default: "" },
    patterns: { type: String, default: "" }, // Patterns / Exposures
    // From awareness to action
    keyInsight: { type: String, default: "" },
    myFocus: { type: String, default: "" },
    myNextStep: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Scope", scopeSchema);
