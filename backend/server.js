const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const { passport, initializePassport } = require("./utils/passport");
initializePassport();

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
app.use("/api/documents", documentRoutes);
app.use("/api/frame-of-mind", frameOfMindRoutes);

app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "SkillSpark API 🚀" }),
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

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌐 Origins: ${allowedOrigins.join(", ")}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });
