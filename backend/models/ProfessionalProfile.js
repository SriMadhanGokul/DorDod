const mongoose = require("mongoose");

const workExperienceSchema = new mongoose.Schema(
  {
    isCurrent: { type: Boolean, default: false },
    organizationName: { type: String, default: "" },
    companyLocation: { type: String, default: "" },
    title: { type: String, default: "" },
    startDate: { type: Date },
    endDate: { type: Date },
    jobResponsibilities: { type: String, default: "" },
  },
  { _id: true },
);

const educationSchema = new mongoose.Schema(
  {
    collegeUniversity: { type: String, default: "" },
    degree: { type: String, default: "" },
    areaOfStudy: { type: String, default: "" },
    degreeCompleted: { type: Boolean, default: false },
    dateCompleted: { type: Date },
  },
  { _id: true },
);

const languageSchema = new mongoose.Schema(
  {
    language: { type: String, default: "" },
    speakingProficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Native", ""],
      default: "",
    },
    writingProficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Native", ""],
      default: "",
    },
    readingProficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Native", ""],
      default: "",
    },
  },
  { _id: true },
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    institution: { type: String, default: "" },
    effectiveDate: { type: Date },
    expirationDate: { type: Date },
  },
  { _id: true },
);

const skillEntrySchema = new mongoose.Schema(
  {
    skill: { type: String, default: "" },
    proficiency: {
      type: String,
      enum: ["1", "2", "3", "4", "5", ""],
      default: "",
    },
  },
  { _id: true },
);

const honorSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    institution: { type: String, default: "" },
    issueDate: { type: Date },
  },
  { _id: true },
);

const professionalProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    workExperience: { type: [workExperienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    languages: { type: [languageSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    functionalSkills: { type: [skillEntrySchema], default: [] },
    technicalSkills: { type: [skillEntrySchema], default: [] },
    honorsAwards: { type: [honorSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "ProfessionalProfile",
  professionalProfileSchema,
);
