const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const { passport, initializePassport } = require("./utils/passport");
initializePassport();

// ── Routes ─────────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const goalRoutes = require("./routes/goalRoutes");
const habitRoutes = require("./routes/habitRoutes");
const skillRoutes = require("./routes/skillRoutes");
const skillPathRoutes = require("./routes/skillPathRoutes");
const devPlanRoutes = require("./routes/devPlanRoutes");
const learningRoutes = require("./routes/learningRoutes");
const profileRoutes = require("./routes/profileRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const communityRoutes = require("./routes/communityRoutes");
const scoreCardRoutes = require("./routes/scoreCardRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const activityRoutes = require("./routes/activityRoutes");
const documentRoutes = require("./routes/documentRoutes");
const frameOfMindRoutes = require("./routes/frameOfMindRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customSkillRoutes = require("./routes/customSkillRoutes");
const xpRoutes = require("./routes/xpRoutes");
const friendsRoutes = require("./routes/friendsRoutes");
const searchRoutes = require("./routes/searchRoutes");
const notifUserRoutes = require("./routes/notificationUserRoutes");
const routineRoutes = require("./routes/routineRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const growthScoreRoutes = require("./routes/growthScoreRoutes");
const financialRoutes = require("./routes/financialRoutes"); // ✅ FINANCIAL ROUTES
const scopeRoutes = require("./routes/scopeRoutes");

// ── Controllers for inline routes ─────────────────────────────────────────────
const { changePassword } = require("./controllers/changePasswordController");
const {
  updateProfilePicture,
} = require("./controllers/profilePictureController");
const { sendWeeklyEmails } = require("./controllers/weeklyEmailController");
const { uploadAvatar } = require("./utils/uploadMiddleware");
const protect = require("./utils/protect");
const adminProtect = require("./middleware/adminMiddleware");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "https://dordod-2.onrender.com",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

const { initFirebase } = require("./utils/firebase");
initFirebase();

// ── Register all routes ────────────────────────────────────────────────────────
// Authentication & User
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notifUserRoutes);

// Learning & Skills
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/skill-path", skillPathRoutes);
app.use("/api/devplan", devPlanRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/custom-skills", customSkillRoutes);

// Analytics & Growth
app.use("/api/analytics", analyticsRoutes);
app.use("/api/growth-score", growthScoreRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/scorecard", scoreCardRoutes);
app.use("/api/xp", xpRoutes);

// Financial Management ✅ NEW
app.use("/api/expenses", expenseRoutes);
app.use("/api/financial", financialRoutes);

// Community & Social
app.use("/api/community", communityRoutes);
app.use("/api/friends", friendsRoutes);

// Additional Features
app.use("/api/documents", documentRoutes);
app.use("/api/frame-of-mind", frameOfMindRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/guidance", require("./routes/guidanceRoutes"));
app.use("/api/checkin", require("./routes/checkInRoutes"));
app.use("/api/search", searchRoutes);
app.use("/api/scop", scopeRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// ── Inline routes ──────────────────────────────────────────────────────────────
app.patch("/api/auth/change-password", protect, changePassword);
app.patch(
  "/api/profile/picture",
  protect,
  uploadAvatar.single("avatar"),
  updateProfilePicture,
);
app.post("/api/admin/send-weekly-emails", adminProtect, sendWeeklyEmails);

// ── Health + error handling ────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "DoR-DoD API 🚀" }),
);

// 404 handler
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Server error",
  });
});

// ── Connect & start ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌐 Allowed Origins: ${allowedOrigins.join(", ")}`);
      console.log("📊 Financial routes loaded: /api/financial, /api/expenses");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });
