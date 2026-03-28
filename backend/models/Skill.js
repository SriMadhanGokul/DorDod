const mongoose = require("mongoose");

const skillEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    current: { type: Number, required: true, min: 1, max: 5 },
    desired: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const swotSchema = new mongoose.Schema(
  {
    strengths: [String],
    weaknesses: [String],
    opportunities: [String],
    threats: [String],
  },
  { _id: false },
);

const skillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one skill doc per user
    },
    skills: {
      type: [skillEntrySchema],
      default: [
        { name: "Leadership", current: 3, desired: 5 },
        { name: "Communication", current: 4, desired: 5 },
        { name: "Technical Skills", current: 4, desired: 5 },
        { name: "Problem Solving", current: 3, desired: 4 },
        { name: "Time Management", current: 2, desired: 4 },
      ],
    },
    swot: {
      type: swotSchema,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Skill", skillSchema);
