const FrameOfMind = require("../models/FrameOfMind");

const MOOD_EMOJI = {
  Happy: "😊",
  Excited: "🤩",
  Neutral: "😐",
  Stressed: "😤",
  Sad: "😢",
  Anxious: "😰",
  Motivated: "💪",
  Tired: "😴",
};

// GET /api/frame-of-mind
const getFrameOfMind = async (req, res) => {
  try {
    const entries = await FrameOfMind.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    const today = await FrameOfMind.findOne({
      user: req.user.id,
      date: { $gte: new Date().setHours(0, 0, 0, 0) },
    });
    res
      .status(200)
      .json({ success: true, data: { entries, todayMood: today || null } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch frame of mind" });
  }
};

// POST /api/frame-of-mind
const logMood = async (req, res) => {
  try {
    const { mood, note } = req.body;
    if (!mood)
      return res
        .status(400)
        .json({ success: false, message: "Mood is required" });

    // Upsert today's entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entry = await FrameOfMind.findOneAndUpdate(
      { user: req.user.id, date: { $gte: today } },
      {
        mood,
        emoji: MOOD_EMOJI[mood] || "😊",
        note: note || "",
        date: new Date(),
      },
      { new: true, upsert: true },
    );
    res
      .status(200)
      .json({ success: true, message: "Mood logged!", data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to log mood" });
  }
};

module.exports = { getFrameOfMind, logMood };
