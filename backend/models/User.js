const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ─── Auth ──────────────────────────────────────────────────────────────
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    hasPassword: { type: Boolean, default: false }, // false for new Google users
    isGoogleUser: { type: Boolean, default: false }, // true if signed up via Google

    // ─── Personal Info ─────────────────────────────────────────────────────
    firstName: { type: String, trim: true, default: "" },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    preferredFullName: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    contactNumber: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say", ""],
      default: "",
    },
    dateOfBirth: { type: Date },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", ""],
      default: "",
    },
    nationality: { type: String, default: "" },
    countryOfBirth: { type: String, default: "" },
    placeOfBirth: { type: String, default: "" },
    country: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    currentCity: { type: String, default: "" },
    currentCountry: { type: String, default: "" },
    pincode: { type: String, default: "" },

    // ─── Profile ───────────────────────────────────────────────────────────
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 300 },
    subscription: {
      type: String,
      enum: ["Free", "Pro", "Enterprise"],
      default: "Free",
    },

    // ─── Notifications ─────────────────────────────────────────────────────
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      weekly: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// Auto-compute display name
userSchema.pre("save", async function (next) {
  if (
    this.isModified("firstName") ||
    this.isModified("lastName") ||
    this.isModified("preferredFullName")
  ) {
    this.name =
      this.preferredFullName ||
      `${this.firstName} ${this.lastName}`.trim() ||
      this.name;
  }
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  // Mark hasPassword true whenever password is set
  this.hasPassword = true;
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
