const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: String, required: true },
    instructor: { type: String, required: true },
    skillTag: { type: String, default: "" }, // links course to a skill name
  },
  { timestamps: true },
);

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

const Course = mongoose.model("Course", courseSchema);
const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = { Course, Enrollment };
