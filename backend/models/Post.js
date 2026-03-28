const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: 1000,
    },
    tags: { type: [String], default: ["General"] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
