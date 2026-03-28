const User = require("../models/User");
const ProfessionalProfile = require("../models/ProfessionalProfile");

// @route PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const allowed = [
      "firstName",
      "middleName",
      "lastName",
      "preferredFullName",
      "bio",
      "contactNumber",
      "gender",
      "dateOfBirth",
      "maritalStatus",
      "nationality",
      "countryOfBirth",
      "placeOfBirth",
      "country",
      "state",
      "city",
      "currentCity",
      "currentCountry",
      "pincode",
    ];

    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Compute display name
    const src = { ...req.body };
    updates.name =
      src.preferredFullName ||
      `${src.firstName || ""} ${src.lastName || ""}`.trim() ||
      req.user.name;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    res
      .status(200)
      .json({
        success: true,
        message: "Profile updated!",
        user: sanitizeUser(user),
      });
  } catch (error) {
    console.error("updateProfile error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

// @route PUT /api/profile/notifications
const updateNotifications = async (req, res) => {
  try {
    const { email, push, weekly } = req.body;
    const updates = {};
    if (email !== undefined) updates["notifications.email"] = email;
    if (push !== undefined) updates["notifications.push"] = push;
    if (weekly !== undefined) updates["notifications.weekly"] = weekly;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true },
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Preferences saved!",
        notifications: user.notifications,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update notifications" });
  }
};

// @route GET /api/profile/professional
const getProfessionalProfile = async (req, res) => {
  try {
    let profile = await ProfessionalProfile.findOne({ user: req.user.id });
    if (!profile)
      profile = await ProfessionalProfile.create({ user: req.user.id });
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch professional profile",
      });
  }
};

// Generic helper to add/update/delete array items in professional profile
const updateProfessionalSection = async (req, res, section) => {
  try {
    let profile = await ProfessionalProfile.findOne({ user: req.user.id });
    if (!profile)
      profile = await ProfessionalProfile.create({ user: req.user.id });

    if (req.method === "POST") {
      profile[section].push(req.body);
      await profile.save();
      return res
        .status(201)
        .json({ success: true, message: "Entry added!", data: profile });
    }

    if (req.method === "PUT") {
      const item = profile[section].id(req.params.itemId);
      if (!item)
        return res
          .status(404)
          .json({ success: false, message: "Entry not found" });
      Object.keys(req.body).forEach((k) => {
        item[k] = req.body[k];
      });
      await profile.save();
      return res
        .status(200)
        .json({ success: true, message: "Entry updated!", data: profile });
    }

    if (req.method === "DELETE") {
      profile[section] = profile[section].filter(
        (i) => i._id.toString() !== req.params.itemId,
      );
      await profile.save();
      return res
        .status(200)
        .json({ success: true, message: "Entry deleted!", data: profile });
    }
  } catch (error) {
    console.error(`updateProfessionalSection(${section}) error:`, error);
    res.status(500).json({ success: false, message: "Operation failed" });
  }
};

const manageWorkExperience = (req, res) =>
  updateProfessionalSection(req, res, "workExperience");
const manageEducation = (req, res) =>
  updateProfessionalSection(req, res, "education");
const manageLanguages = (req, res) =>
  updateProfessionalSection(req, res, "languages");
const manageCertifications = (req, res) =>
  updateProfessionalSection(req, res, "certifications");
const manageFunctionalSkills = (req, res) =>
  updateProfessionalSection(req, res, "functionalSkills");
const manageTechnicalSkills = (req, res) =>
  updateProfessionalSection(req, res, "technicalSkills");
const manageHonorsAwards = (req, res) =>
  updateProfessionalSection(req, res, "honorsAwards");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  firstName: user.firstName,
  middleName: user.middleName,
  lastName: user.lastName,
  preferredFullName: user.preferredFullName,
  contactNumber: user.contactNumber,
  gender: user.gender,
  dateOfBirth: user.dateOfBirth,
  maritalStatus: user.maritalStatus,
  nationality: user.nationality,
  country: user.country,
  state: user.state,
  city: user.city,
  currentCity: user.currentCity,
  currentCountry: user.currentCountry,
  pincode: user.pincode,
  avatar: user.avatar,
  bio: user.bio,
  subscription: user.subscription,
  notifications: user.notifications,
});

module.exports = {
  updateProfile,
  updateNotifications,
  getProfessionalProfile,
  manageWorkExperience,
  manageEducation,
  manageLanguages,
  manageCertifications,
  manageFunctionalSkills,
  manageTechnicalSkills,
  manageHonorsAwards,
};
