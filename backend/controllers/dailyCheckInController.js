const DailyCheckIn = require("../models/DailyCheckIn");

const getToday = () => new Date().toISOString().split("T")[0];

// Get all check-ins
exports.getCheckIns = async (req, res) => {
  try {
    const checkIns = await DailyCheckIn.find({ userId: req.user.id }).sort({
      date: -1,
    });
    res.json({ success: true, data: checkIns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get today's check-in
exports.getCheckInToday = async (req, res) => {
  try {
    const today = getToday();
    const checkIn = await DailyCheckIn.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!checkIn) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: checkIn });
  } catch (error) {
    console.error("Check-in today error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single check-in
exports.getCheckIn = async (req, res) => {
  try {
    const checkIn = await DailyCheckIn.findById(req.params.id);
    if (!checkIn) {
      return res
        .status(404)
        .json({ success: false, message: "Check-in not found" });
    }
    res.json({ success: true, data: checkIn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create check-in
exports.createCheckIn = async (req, res) => {
  try {
    const { date, mood, energy, focus } = req.body;
    const today = getToday();

    const checkIn = await DailyCheckIn.create({
      userId: req.user.id,
      date: date || today,
      mood,
      energy,
      focus,
      completed: true,
    });

    res.status(201).json({ success: true, data: checkIn });
  } catch (error) {
    console.error("Create check-in error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update check-in
exports.updateCheckIn = async (req, res) => {
  try {
    const checkIn = await DailyCheckIn.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json({ success: true, data: checkIn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete check-in
exports.deleteCheckIn = async (req, res) => {
  try {
    await DailyCheckIn.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Check-in deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
