const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const { passport, initializePassport } = require("./utils/passport");
initializePassport();

// ── Existing routes ────────────────────────────────────────────────────────────
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

// ── New routes ─────────────────────────────────────────────────────────────────
const searchRoutes = require("./routes/searchRoutes");
const notifUserRoutes = require("./routes/notificationUserRoutes");

// ── Controllers for inline routes ─────────────────────────────────────────────
const { changePassword } = require("./controllers/changePasswordController");
const {
  updateProfilePicture,
} = require("./controllers/profilePictureController");
const { sendWeeklyEmails } = require("./controllers/weeklyEmailController");
const protect = require("./utils/protect");
const adminProtect = require("./middleware/adminMiddleware");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
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

// ── Register all routes ────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/skill-path", skillPathRoutes);
app.use("/api/devplan", devPlanRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/scorecard", scoreCardRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/xp", xpRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/guidance", require("./routes/guidanceRoutes"));
app.use("/api/checkin", require("./routes/checkInRoutes"));
app.use("/api/documents", documentRoutes);
app.use("/api/frame-of-mind", frameOfMindRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/custom-skills", customSkillRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/xp", xpRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/guidance", require("./routes/guidanceRoutes"));
app.use("/api/checkin", require("./routes/checkInRoutes"));
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notifUserRoutes);

// ── Inline routes ──────────────────────────────────────────────────────────────
app.patch("/api/auth/change-password", protect, changePassword);
app.patch("/api/profile/picture", protect, updateProfilePicture);
app.post("/api/admin/send-weekly-emails", adminProtect, sendWeeklyEmails);

// ── Health + error handling ────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "DoR-DoD API 🚀" }),
);
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Server error" });
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
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });
