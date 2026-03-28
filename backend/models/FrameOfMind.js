const mongoose = require("mongoose");

const frameSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mood: {
      type: String,
      enum: [
        "Happy",
        "Excited",
        "Neutral",
        "Stressed",
        "Sad",
        "Anxious",
        "Motivated",
        "Tired",
      ],
      required: true,
    },
    emoji: { type: String, default: "😊" },
    note: { type: String, default: "", maxlength: 300 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FrameOfMind", frameSchema);
