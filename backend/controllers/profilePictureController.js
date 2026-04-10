const User = require("../models/User");

// PATCH /api/profile/picture
// Accepts base64 image string
const updateProfilePicture = async (req, res) => {
  try {
    const { avatar } = req.body; // base64 string: "data:image/jpeg;base64,..."
    if (!avatar)
      return res
        .status(400)
        .json({ success: false, message: "No image provided" });

    // Validate it's a base64 image (basic check)
    if (!avatar.startsWith("data:image/"))
      return res
        .status(400)
        .json({ success: false, message: "Invalid image format" });

    // Size check — base64 of 2MB = ~2.7MB string
    if (avatar.length > 3 * 1024 * 1024)
      return res
        .status(400)
        .json({ success: false, message: "Image too large. Max 2MB." });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated!",
      data: { avatar: user.avatar },
    });
  } catch (err) {
    console.error("updateProfilePicture error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile picture" });
  }
};

module.exports = { updateProfilePicture };
