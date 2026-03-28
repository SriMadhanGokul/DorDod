const express = require("express");
const router = express.Router();
const { passport } = require("../utils/passport");
const {
  sendOTP,
  verifyOTP,
  setPassword,
  resendOTP,
  login,
  logout,
  getMe,
  setupPassword,
  forgotPassword,
  resetPassword,
  googleCallback,
} = require("../controllers/authController");
const protect = require("../utils/protect");

// ─── OTP Registration Flow ────────────────────────────────────────────────────
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/set-password", setPassword);
router.post("/resend-otp", resendOTP);

// ─── Standard Auth ────────────────────────────────────────────────────────────
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

// ─── Google Password Setup (protected — user already has JWT cookie) ──────────
router.post("/setup-password", protect, setupPassword);

// ─── Password Reset ───────────────────────────────────────────────────────────
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  googleCallback,
);

module.exports = router;
