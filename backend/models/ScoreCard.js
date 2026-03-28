const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 1, max: 100 },
    comment: { type: String, default: "" },
    category: { type: String, default: "General" },
  },
  { timestamps: true },
);

const scoreCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    myScore: { type: Number, default: 0 },
    scoresGiven: [scoreSchema],
    scoresReceived: [scoreSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("ScoreCard", scoreCardSchema);
