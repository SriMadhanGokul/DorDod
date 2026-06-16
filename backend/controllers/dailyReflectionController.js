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
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get today's reflection
exports.getReflectionToday = async (req, res) => {
  try {
    const today = getToday();
    const reflection = await DailyReflection.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!reflection) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: reflection });
  } catch (error) {
    console.error("Reflection today error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single reflection
exports.getReflection = async (req, res) => {
  try {
    const reflection = await DailyReflection.findById(req.params.id);
    if (!reflection) {
      return res.status(404).json({
        success: false,
        message: "Reflection not found",
      });
    }
    res.json({ success: true, data: reflection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create reflection
exports.createReflection = async (req, res) => {
  try {
    const { date, title, content } = req.body;
    const today = getToday();

    const reflection = await DailyReflection.create({
      userId: req.user.id,
      date: date || today,
      title,
      content,
      completed: true,
    });

    res.status(201).json({ success: true, data: reflection });
  } catch (error) {
    console.error("Create reflection error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update reflection
exports.updateReflection = async (req, res) => {
  try {
    const reflection = await DailyReflection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json({ success: true, data: reflection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete reflection
exports.deleteReflection = async (req, res) => {
  try {
    await DailyReflection.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Reflection deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
