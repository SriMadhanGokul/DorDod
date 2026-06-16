const mongoose = require("mongoose");

// UPDATED: Allow multiple SCOPs per user + history tracking
const scopeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Changed from unique to index for multiple scopes
    },
    // Four sections
    strengths: { type: String, default: "" },
    constraints: { type: String, default: "" },
    opportunities: { type: String, default: "" },
    patterns: { type: String, default: "" },
    // From awareness to action
    keyInsight: { type: String, default: "" },
    myFocus: { type: String, default: "" },
    myNextStep: { type: String, default: "" },
    // ✅ NEW: Track reset history
    history: [
      {
        date: { type: Date, default: Date.now },
        strengths: String,
        constraints: String,
        opportunities: String,
        patterns: String,
        keyInsight: String,
        myFocus: String,
        myNextStep: String,
        reason: { type: String, default: "Manual update" }, // "reset", "update", etc.
      },
    ],
    // ✅ NEW: Scope title/name
    title: {
      type: String,
      default: function () {
        const today = new Date().toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `SCOP — ${today}`;
      },
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Scope", scopeSchema);
