const mongoose = require("mongoose");

const guidanceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD

    // Context passed from Dashboard (item #11)
    context: {
      goal: { type: String, default: "" },
      loopType: { type: String, default: "None" },
      mindState: { type: String, default: "" },
    },

    // Seeker/Guide chat messages
    messages: [
      {
        role: { type: String, enum: ["seeker", "guide"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Post-session updates (item #12)
    completed: { type: Boolean, default: false },
    intentUpdate: { type: String, default: "" }, // updates Intent/Goals
    behaviorSuggestion: { type: String, default: "" }, // suggests new Behavior
    sessionInsight: { type: String, default: "" }, // stored in Insights
  },
  { timestamps: true },
);

module.exports = mongoose.model("GuidanceSession", guidanceSessionSchema);
