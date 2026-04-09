const bcrypt = require("bcryptjs");
const User = require("../models/User");

// PATCH /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res
        .status(400)
        .json({
          success: false,
          message: "New password must be at least 6 characters",
        });

    const user = await User.findById(req.user.id).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // If user has a password, verify current one
    if (user.hasPassword && user.password) {
      if (!currentPassword)
        return res
          .status(400)
          .json({ success: false, message: "Current password is required" });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match)
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.hasPassword = true;
    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json({ success: true, message: "✅ Password changed successfully!" });
  } catch (err) {
    console.error("changePassword error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
};

module.exports = { changePassword };
