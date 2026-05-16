const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 1000 },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    tags: { type: [String], default: ["General"] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: { type: [commentSchema], default: [] },
    mediaType: {
      type: String,
      enum: ["none", "image", "video", "link", "file"],
      default: "none",
    },
    mediaUrl: { type: String, default: "" },
    mediaFileName: { type: String, default: "" },
    linkPreview: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      url: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
