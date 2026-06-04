// backend/controllers/profilePictureController.js
const User = require("../models/User");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require("../utils/cloudinary");

// PATCH /api/profile/picture  (multipart/form-data with field "avatar")
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image provided" });
    }

    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Delete old avatar from Cloudinary if it exists
    if (user.avatar && user.avatar.includes("cloudinary.com")) {
      const oldPublicId = getPublicIdFromUrl(user.avatar);
      if (oldPublicId) await deleteFromCloudinary(oldPublicId, "image");
    }

    // Upload new avatar to Cloudinary
    const { url } = await uploadToCloudinary(req.file.buffer, {
      folder: `avatars/${req.user.id}`,
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // Save URL to user
    user.avatar = url;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture updated!",
      data: { avatar: url },
    });
  } catch (err) {
    console.error("updateProfilePicture error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile picture" });
  }
};

module.exports = { updateProfilePicture };
