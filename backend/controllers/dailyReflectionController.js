const DailyReflection = require("../models/DailyReflection");

// ✅ GET reflection for today
exports.getTodayReflection = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reflection = await DailyReflection.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    res.status(200).json({
      success: true,
      data: reflection || {
        date: today.toISOString().split("T")[0],
        title: "",
        content: "",
        completed: false,
      },
    });
  } catch (error) {
    console.error("getTodayReflection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reflection",
    });
  }
};

// ✅ CREATE or UPDATE reflection
exports.createReflection = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    if (title.length < 3 || content.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Title must be at least 3 characters and content at least 10 characters",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find existing reflection for today
    let reflection = await DailyReflection.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (reflection) {
      // Update existing
      reflection.title = title;
      reflection.content = content;
      reflection.tags = tags || [];
      reflection.completed = true;
      await reflection.save();
    } else {
      // Create new
      reflection = await DailyReflection.create({
        userId: req.user.id,
        date: today,
        title,
        content,
        tags: tags || [],
        completed: true,
      });
    }

    res.status(200).json({
      success: true,
      message: "Reflection saved successfully",
      data: reflection,
    });
  } catch (error) {
    console.error("createReflection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save reflection",
    });
  }
};

// ✅ GET reflection history (last 30 days)
exports.getReflectionHistory = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reflections = await DailyReflection.find({
      userId: req.user.id,
      date: {
        $gte: thirtyDaysAgo,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: reflections,
    });
  } catch (error) {
    console.error("getReflectionHistory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
};

// ✅ GET single reflection
exports.getReflection = async (req, res) => {
  try {
    const reflection = await DailyReflection.findById(req.params.id);

    if (!reflection || reflection.userId.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: "Reflection not found",
      });
    }

    res.status(200).json({
      success: true,
      data: reflection,
    });
  } catch (error) {
    console.error("getReflection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reflection",
    });
  }
};

// ✅ DELETE reflection
exports.deleteReflection = async (req, res) => {
  try {
    const reflection = await DailyReflection.findById(req.params.id);

    if (!reflection || reflection.userId.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: "Reflection not found",
      });
    }

    await DailyReflection.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Reflection deleted",
    });
  } catch (error) {
    console.error("deleteReflection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete reflection",
    });
  }
};

// ✅ GET reflection stats (completion rate, count)
exports.getReflectionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reflections = await DailyReflection.find({
      userId: req.user.id,
      date: {
        $gte: thirtyDaysAgo,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const completed = reflections.filter((r) => r.completed).length;
    const total = 30; // Days in period
    const completionRate = Math.round((completed / total) * 100);

    res.status(200).json({
      success: true,
      data: {
        totalReflections: reflections.length,
        completionRate,
        completedDays: completed,
        totalDays: total,
      },
    });
  } catch (error) {
    console.error("getReflectionStats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};
