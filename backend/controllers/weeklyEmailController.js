const User = require("../models/User");
const Goal = require("../models/Goal");
const Habit = require("../models/Habit");
const { Enrollment, Course } = require("../models/Course");
const { sendWeeklySummaryEmail } = require("../utils/emailService");

// POST /api/admin/send-weekly-emails  (admin triggers manually or via cron)
const sendWeeklyEmails = async (req, res) => {
  try {
    const users = await User.find({ role: "user", suspended: false }).select(
      "name email",
    );
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newCourses = await Course.countDocuments({
      status: "approved",
      createdAt: { $gte: oneWeekAgo },
    });

    let sent = 0;
    for (const user of users) {
      try {
        const [goals, habits, enrollments] = await Promise.all([
          Goal.find({
            user: user._id,
            status: "Completed",
            updatedAt: { $gte: oneWeekAgo },
          }),
          Habit.find({ user: user._id }),
          Enrollment.find({ user: user._id }),
        ]);

        let totalDays = 0,
          doneDays = 0;
        habits.forEach((h) => {
          totalDays += h.days.length;
          doneDays += h.days.filter(Boolean).length;
        });

        await sendWeeklySummaryEmail(user.email, user.name, {
          goalsCompleted: goals.length,
          habitRate:
            totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0,
          coursesEnrolled: enrollments.length,
          newCourses,
        });
        sent++;
        await new Promise((r) => setTimeout(r, 200)); // avoid rate limits
      } catch (e) {
        console.error(`Email failed for ${user.email}:`, e.message);
      }
    }

    res
      .status(200)
      .json({ success: true, message: `Weekly emails sent to ${sent} users!` });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to send weekly emails" });
  }
};

module.exports = { sendWeeklyEmails };
