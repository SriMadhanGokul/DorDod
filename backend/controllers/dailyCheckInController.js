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
    console.error("Get check-ins error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get today's check-in
exports.getCheckInToday = async (req, res) => {
  try {
    const today = getToday();

    console.log(`\n📋 GET CHECK-IN TODAY`);
    console.log(`   User: ${req.user.id}`);
    console.log(`   Date: ${today}`);

    const checkIn = await DailyCheckIn.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!checkIn) {
      console.log(`   ℹ️  No check-in found for today`);
      return res.json({ success: true, data: null });
    }

    console.log(`   ✅ Check-in found`);
    res.json({ success: true, data: checkIn });
  } catch (error) {
    console.error("❌ Check-in today error:", error);
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
    console.error("Get check-in error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create/Update check-in (FIXED)
exports.createCheckIn = async (req, res) => {
  try {
    const { date, mood, energy, focus } = req.body;
    const today = getToday();

    console.log(`\n📋 CREATE/UPDATE CHECK-IN`);
    console.log(`   User: ${req.user.id}`);
    console.log(`   Input date: ${date}`);
    console.log(`   Today: ${today}`);

    // ✅ Validate required fields
    if (!mood || energy === undefined || focus === undefined) {
      return res.status(400).json({
        success: false,
        message: "Mood, energy, and focus are required",
      });
    }

    // ✅ Validate number ranges
    if (energy < 1 || energy > 10 || focus < 1 || focus > 10) {
      return res.status(400).json({
        success: false,
        message: "Energy and focus must be between 1 and 10",
      });
    }

    // ✅ Ensure date is in YYYY-MM-DD format
    const dateToUse = date && date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : today;
    console.log(`   Using date: ${dateToUse}`);

    // ✅ UPSERT: Try to find and update, else create
    try {
      const existing = await DailyCheckIn.findOne({
        userId: req.user.id,
        date: dateToUse,
      });

      if (existing) {
        console.log(`   📝 Check-in exists, updating...`);
        const updated = await DailyCheckIn.findByIdAndUpdate(
          existing._id,
          {
            mood,
            energy,
            focus,
            completed: true,
          },
          { new: true },
        );
        console.log(`   ✅ Check-in updated: ${updated._id}\n`);
        return res.json({
          success: true,
          data: updated,
          message: "Check-in updated",
        });
      }
    } catch (findError) {
      console.error(`   ⚠️  Find error: ${findError.message}`);
    }

    // ✅ Create new check-in with explicit date
    console.log(`   🆕 Creating new check-in...`);
    const checkIn = await DailyCheckIn.create({
      userId: req.user.id,
      date: dateToUse,
      mood,
      energy,
      focus,
      completed: true,
    });

    console.log(`   ✅ Check-in created: ${checkIn._id}\n`);
    res.status(201).json({ success: true, data: checkIn });
  } catch (error) {
    console.error(`\n❌ CREATE CHECK-IN ERROR:`, error.message);
    console.error(`   Code: ${error.code}`);
    console.error(`   Stack: ${error.stack}\n`);

    // ✅ Handle E11000 duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Check-in already exists for this date. Please refresh and edit instead.",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// Update check-in
exports.updateCheckIn = async (req, res) => {
  try {
    const { mood, energy, focus } = req.body;

    // ✅ Validate if provided
    if (energy && (energy < 1 || energy > 10)) {
      return res.status(400).json({
        success: false,
        message: "Energy must be between 1 and 10",
      });
    }

    if (focus && (focus < 1 || focus > 10)) {
      return res.status(400).json({
        success: false,
        message: "Focus must be between 1 and 10",
      });
    }

    const checkIn = await DailyCheckIn.findByIdAndUpdate(
      req.params.id,
      {
        ...(mood && { mood }),
        ...(energy && { energy }),
        ...(focus && { focus }),
      },
      { new: true },
    );

    if (!checkIn) {
      return res
        .status(404)
        .json({ success: false, message: "Check-in not found" });
    }

    res.json({ success: true, data: checkIn });
  } catch (error) {
    console.error("Update check-in error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete check-in
exports.deleteCheckIn = async (req, res) => {
  try {
    const checkIn = await DailyCheckIn.findByIdAndDelete(req.params.id);
    if (!checkIn) {
      return res
        .status(404)
        .json({ success: false, message: "Check-in not found" });
    }
    res.json({ success: true, message: "Check-in deleted" });
  } catch (error) {
    console.error("Delete check-in error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
