const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "Resume",
        "Portfolio",
        "Educational",
        "Cover Letter",
        "Professional",
        "Personal/KYC",
        "Bank",
        "Accomplishment",
        "Other",
      ],
      default: "Other",
    },
    fileUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);
