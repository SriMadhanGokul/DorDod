const Goal = require("../models/Goal");

// ✅ FIXED: Use LOCAL timezone, not UTC
const getToday = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const fixDayCompletion = (goal) => {
  if (!goal.dayCompletion) goal.dayCompletion = {};
  if (goal.dayCompletion instanceof Map) {
    goal.dayCompletion = Object.fromEntries(goal.dayCompletion);
  }
  return goal;
};

// ✅ COUNT ONLY REAL DATES (filter out Mongoose properties)
const getCompletedCount = (dayCompletion) => {
  return Object.keys(dayCompletion).filter((key) => !key.startsWith("$"))
    .length;
};

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    goals.forEach(fixDayCompletion);
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { title, description, deadline, category, priority, duration } =
      req.body;
    const goal = await Goal.create({
      userId: req.user.id,
      title,
      description,
      deadline,
      category,
      priority,
      duration: duration || 21,
      status: "archived",
      progress: 0,
      dayCompletion: {},
    });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markDayComplete = async (req, res) => {
  try {
    const goalId = req.params.id;
    const dayNumber = parseInt(req.params.day);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📍 MARK DAY COMPLETE REQUEST`);
    console.log(`   Goal ID: ${goalId}`);
    console.log(`   Day Number: ${dayNumber}`);
    console.log(`${"=".repeat(60)}\n`);

    const goal = await Goal.findById(goalId);
    if (!goal) {
      console.error(`❌ Goal not found: ${goalId}`);
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    console.log(`✅ Goal found: ${goal.title}`);
    console.log(`   Created: ${goal.createdAt}`);
    console.log(`   Current dayCompletion:`, goal.dayCompletion);

    fixDayCompletion(goal);

    // ✅ CRITICAL: Get today's date using LOCAL timezone
    const today = getToday();
    console.log(`   Today (LOCAL): ${today}`);

    // ✅ FIXED: Calculate the due date for this day number using LOCAL timezone
    const createdDate = new Date(goal.createdAt);
    const createdYyyy = createdDate.getFullYear();
    const createdMm = createdDate.getMonth();
    const createdDd = createdDate.getDate();

    // Create local date (midnight on creation date in user's timezone)
    const createdLocal = new Date(createdYyyy, createdMm, createdDd);

    const targetDate = new Date(createdLocal);
    targetDate.setDate(targetDate.getDate() + dayNumber - 1);

    const targetYyyy = targetDate.getFullYear();
    const targetMm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const targetDd = String(targetDate.getDate()).padStart(2, "0");
    const completionDate = `${targetYyyy}-${targetMm}-${targetDd}`;

    console.log(`\n📅 DATE CALCULATION (LOCAL TIMEZONE):`);
    console.log(
      `   Created Date (Local): ${createdYyyy}-${String(createdMm + 1).padStart(2, "0")}-${String(createdDd).padStart(2, "0")}`,
    );
    console.log(`   Day Number: ${dayNumber}`);
    console.log(`   Completion Date: ${completionDate}`);
    console.log(`   Today: ${today}`);

    // ✅ CALENDAR-DAY-BASED CHECK: Can only mark on or after the due date
    if (completionDate > today) {
      console.error(
        `❌ Future date: ${completionDate} > ${today} (cannot mark yet)`,
      );
      return res.status(400).json({
        success: false,
        message: `Cannot mark future dates. This day is due on ${completionDate}`,
      });
    }

    // ✅ CALENDAR-DAY-BASED CHECK: Check if already completed on this specific date
    if (goal.dayCompletion[completionDate]) {
      console.warn(
        `⚠️ Already completed on ${completionDate}. Cannot mark again on same calendar day.`,
      );
      console.log(
        `   Current dayCompletion[${completionDate}]:`,
        goal.dayCompletion[completionDate],
      );
      return res.status(400).json({
        success: true,
        message: "Already completed on " + completionDate,
        alreadyCompleted: true,
        data: goal,
      });
    }

    console.log(`\n✅ MARKING DAY AS COMPLETE`);

    // ✅ Mark this specific calendar day as complete
    goal.dayCompletion[completionDate] = {
      date: completionDate,
      dayNumber: dayNumber,
      completedAt: new Date().toISOString(),
      status: "completed",
    };

    console.log(`   Marked: dayCompletion[${completionDate}] = ...`);
    console.log(`   dayCompletion after marking:`, goal.dayCompletion);

    // ✅ CRITICAL: Mark Map as modified so Mongoose saves it
    goal.markModified("dayCompletion");

    // ✅ Recalculate progress from actual completion count
    const completedCount = getCompletedCount(goal.dayCompletion);
    const newProgress = Math.min(
      100,
      Math.round((completedCount / goal.duration) * 100),
    );

    console.log(`\n📊 PROGRESS CALCULATION:`);
    console.log(`   Completed Days: ${completedCount}`);
    console.log(`   Total Days: ${goal.duration}`);
    console.log(`   Old Progress: ${goal.progress}%`);
    console.log(`   New Progress: ${newProgress}%`);

    goal.progress = newProgress;

    // Auto-complete if done
    if (completedCount >= goal.duration) {
      goal.status = "completed";
      goal.completedAt = new Date();
      console.log(`\n🎉 GOAL COMPLETED!`);
    }

    console.log(`\n💾 SAVING GOAL...`);

    try {
      await goal.save();
      console.log(`✅ GOAL SAVED SUCCESSFULLY`);
    } catch (saveError) {
      console.error(`❌ SAVE ERROR:`, saveError);
      throw saveError;
    }

    // ✅ Fix dayCompletion before sending response
    fixDayCompletion(goal);

    console.log(`\n📦 SENDING RESPONSE:`);
    console.log(`   Success: true`);
    console.log(`   dayCompletion in response:`, goal.dayCompletion);
    console.log(`   progress in response:`, goal.progress);
    console.log(`${"=".repeat(60)}\n`);

    res.json({
      success: true,
      message: `Day ${dayNumber} marked complete!`,
      data: goal,
    });
  } catch (error) {
    console.error(`\n❌ ERROR IN MARK_DAY_COMPLETE:`, error);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`${"=".repeat(60)}\n`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markGoalIncomplete = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });

    fixDayCompletion(goal);
    const dateToRemove = req.body.date || getToday();

    if (goal.dayCompletion[dateToRemove]) {
      delete goal.dayCompletion[dateToRemove];
    }

    const completedCount = getCompletedCount(goal.dayCompletion);
    goal.progress = Math.round((completedCount / goal.duration) * 100);

    if (goal.status === "completed") {
      goal.status = "active";
      goal.completedAt = null;
    }

    await goal.save();
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.activateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true },
    );
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.pauseGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { status: "paused" },
      { new: true },
    );
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resumeGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true },
    );
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markGoalComplete = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal)
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });

    fixDayCompletion(goal);
    const today = getToday();

    if (goal.dayCompletion[today]) {
      return res.json({
        success: true,
        message: "Already done today",
        data: goal,
      });
    }

    goal.dayCompletion[today] = {
      date: today,
      completedAt: new Date().toISOString(),
      status: "completed",
    };

    const completedCount = getCompletedCount(goal.dayCompletion);
    goal.progress = Math.round((completedCount / goal.duration) * 100);

    if (completedCount >= goal.duration) {
      goal.status = "completed";
      goal.completedAt = new Date();
    }

    await goal.save();
    fixDayCompletion(goal);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGoalStats = async (req, res) => {
  try {
    const total = await Goal.countDocuments({ userId: req.user.id });
    const completed = await Goal.countDocuments({
      userId: req.user.id,
      status: "completed",
    });
    const active = await Goal.countDocuments({
      userId: req.user.id,
      status: "active",
    });
    const paused = await Goal.countDocuments({
      userId: req.user.id,
      status: "paused",
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        completed,
        paused,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
