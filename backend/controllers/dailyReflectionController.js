const DailyReflection = require("../models/DailyReflection");

const getToday = () => new Date().toISOString().split("T")[0];

// Get all reflections
exports.getReflections = async (req, res) => {
  try {
    const reflections = await DailyReflection.find({
      userId: req.user.id,
    }).sort({
      date: -1,
    });
    res.json({ success: true, data: reflections });
  } catch (error) {
    console.error("Get reflections error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get today's reflection
exports.getReflectionToday = async (req, res) => {
  try {
    const today = getToday();

    console.log(`\n📝 GET REFLECTION TODAY`);
    console.log(`   User: ${req.user.id}`);
    console.log(`   Date: ${today}`);

    const reflection = await DailyReflection.findOne({
      userId: req.user.id,
      date: today, // ✅ Now properly matches String dates
    });

    if (!reflection) {
      console.log(`   ℹ️  No reflection found for today`);
      return res.json({ success: true, data: null });
    }

    console.log(`   ✅ Reflection found`);
    res.json({ success: true, data: reflection });
  } catch (error) {
    console.error("❌ Reflection today error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single reflection
exports.getReflection = async (req, res) => {
  try {
    const reflection = await DailyReflection.findById(req.params.id);
    if (!reflection) {
      return res
        .status(404)
        .json({ success: false, message: "Reflection not found" });
    }
    res.json({ success: true, data: reflection });
  } catch (error) {
    console.error("Get reflection error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create reflection (FIXED with proper date handling)
exports.createReflection = async (req, res) => {
  try {
    const { date, title, content, mood, keyTakeaway, actionItems } = req.body;
    const today = getToday();

    console.log(`\n📝 CREATE REFLECTION`);
    console.log(`   User: ${req.user.id}`);
    console.log(`   Date: ${date || today}`);
    console.log(`   Title: ${title}`);

    // ✅ Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    // ✅ Use provided date or today's date (ensure YYYY-MM-DD format)
    const dateToUse = date || today;

    // ✅ Check if reflection already exists for this date
    const existing = await DailyReflection.findOne({
      userId: req.user.id,
      date: dateToUse,
    });

    if (existing) {
      console.log(`   ℹ️  Reflection already exists, updating...`);
      // Update existing
      const updated = await DailyReflection.findByIdAndUpdate(
        existing._id,
        {
          title,
          content,
          ...(mood && { mood }),
          ...(keyTakeaway && { keyTakeaway }),
          ...(actionItems && { actionItems }),
          completed: true,
        },
        { new: true },
      );
      return res.json({
        success: true,
        data: updated,
        message: "Reflection updated",
      });
    }

    // ✅ Create new reflection
    const reflection = await DailyReflection.create({
      userId: req.user.id,
      date: dateToUse, // ✅ String format YYYY-MM-DD
      title,
      content,
      mood: mood || "neutral",
      keyTakeaway: keyTakeaway || "",
      actionItems: actionItems || [],
      completed: true,
    });

    console.log(`   ✅ Reflection created: ${reflection._id}\n`);
    res.status(201).json({ success: true, data: reflection });
  } catch (error) {
    console.error("❌ Create reflection error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update reflection
exports.updateReflection = async (req, res) => {
  try {
    const { title, content, mood, keyTakeaway, actionItems } = req.body;

    const reflection = await DailyReflection.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(content && { content }),
        ...(mood && { mood }),
        ...(keyTakeaway && { keyTakeaway }),
        ...(actionItems && { actionItems }),
      },
      { new: true },
    );

    if (!reflection) {
      return res
        .status(404)
        .json({ success: false, message: "Reflection not found" });
    }

    res.json({ success: true, data: reflection });
  } catch (error) {
    console.error("Update reflection error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete reflection
exports.deleteReflection = async (req, res) => {
  try {
    const reflection = await DailyReflection.findByIdAndDelete(req.params.id);
    if (!reflection) {
      return res
        .status(404)
        .json({ success: false, message: "Reflection not found" });
    }
    res.json({ success: true, message: "Reflection deleted" });
  } catch (error) {
    console.error("Delete reflection error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
