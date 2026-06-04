const User                = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const { uploadToFirebase, deleteFromFirebase } = require('../utils/firebase');

const sanitizeUser = (user) => ({
  id: user._id, name: user.name, email: user.email,
  firstName: user.firstName, lastName: user.lastName,
  middleName: user.middleName,
  preferredFullName: user.preferredFullName,
  contactNumber: user.contactNumber, gender: user.gender,
  dateOfBirth: user.dateOfBirth, maritalStatus: user.maritalStatus,
  nationality: user.nationality, country: user.country,
  state: user.state, city: user.city, currentCity: user.currentCity,
  pincode: user.pincode, bio: user.bio, avatar: user.avatar,
  subscription: user.subscription, notifications: user.notifications,
  hasPassword: user.hasPassword, isGoogleUser: user.isGoogleUser,
  role: user.role || 'user',
});

// ── PUT /api/profile ──────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName','middleName','lastName','preferredFullName','bio',
      'contactNumber','gender','dateOfBirth','maritalStatus','nationality',
      'countryOfBirth','placeOfBirth','country','state','city','currentCity',
      'currentCountry','pincode'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const src = { ...req.body };
    updates.name = src.preferredFullName ||
      `${src.firstName || ''} ${src.lastName || ''}`.trim() ||
      req.user.name;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated!', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ── POST /api/profile/avatar — Upload profile picture to Firebase ─────────────
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const user = await User.findById(req.user.id);

    // Delete old avatar from Firebase if exists
    if (user.avatar && user.avatar.includes('storage.googleapis.com')) {
      await deleteFromFirebase(user.avatar).catch(() => {});
    }

    // Upload new avatar to Firebase
    const { url } = await uploadToFirebase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `avatars/${req.user.id}`
    );

    user.avatar = url;
    await user.save();

    res.status(200).json({ success: true, message: 'Profile picture updated!', avatar: url, user: sanitizeUser(user) });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload profile picture' });
  }
};

// ── GET /api/profile/score — Profile completeness score ──────────────────────
const getProfileScore = async (req, res) => {
  try {
    const user    = await User.findById(req.user.id);
    const profile = await ProfessionalProfile.findOne({ user: req.user.id });

    // Personal fields (50 points total)
    const personalFields = [
      { field: 'firstName',         points: 5,  label: 'First Name'        },
      { field: 'lastName',          points: 5,  label: 'Last Name'         },
      { field: 'contactNumber',     points: 3,  label: 'Contact Number'    },
      { field: 'gender',            points: 3,  label: 'Gender'            },
      { field: 'dateOfBirth',       points: 3,  label: 'Date of Birth'     },
      { field: 'nationality',       points: 2,  label: 'Nationality'       },
      { field: 'country',           points: 3,  label: 'Country'           },
      { field: 'state',             points: 2,  label: 'State'             },
      { field: 'city',              points: 2,  label: 'City'              },
      { field: 'pincode',           points: 2,  label: 'Pincode'           },
      { field: 'bio',               points: 5,  label: 'Bio'               },
      { field: 'avatar',            points: 8,  label: 'Profile Picture'   },
      { field: 'maritalStatus',     points: 2,  label: 'Marital Status'    },
      { field: 'preferredFullName', points: 5,  label: 'Preferred Name'    },
    ];

    let personalScore = 0;
    const personalMissing = [];
    personalFields.forEach(({ field, points, label }) => {
      if (user[field] && user[field].toString().trim() !== '') {
        personalScore += points;
      } else {
        personalMissing.push({ label, points });
      }
    });

    // Professional fields (50 points total)
    let professionalScore = 0;
    const professionalMissing = [];

    if (profile) {
      if (profile.workExperience?.length > 0)  { professionalScore += 15; } else professionalMissing.push({ label: 'Work Experience', points: 15 });
      if (profile.education?.length > 0)        { professionalScore += 12; } else professionalMissing.push({ label: 'Education', points: 12 });
      if (profile.languages?.length > 0)        { professionalScore += 5;  } else professionalMissing.push({ label: 'Language Skills', points: 5 });
      if (profile.certifications?.length > 0)   { professionalScore += 8;  } else professionalMissing.push({ label: 'Certifications', points: 8 });
      if (profile.technicalSkills?.length > 0)  { professionalScore += 5;  } else professionalMissing.push({ label: 'Technical Skills', points: 5 });
      if (profile.functionalSkills?.length > 0) { professionalScore += 3;  } else professionalMissing.push({ label: 'Functional Skills', points: 3 });
      if (profile.honorsAwards?.length > 0)     { professionalScore += 2;  } else professionalMissing.push({ label: 'Honors / Awards', points: 2 });
    } else {
      professionalMissing.push(
        { label: 'Work Experience', points: 15 },
        { label: 'Education', points: 12 },
        { label: 'Language Skills', points: 5 },
        { label: 'Certifications', points: 8 },
        { label: 'Technical Skills', points: 5 },
        { label: 'Functional Skills', points: 3 },
        { label: 'Honors / Awards', points: 2 },
      );
    }

    const totalScore = Math.min(100, personalScore + professionalScore);
    const label = totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Incomplete';

    res.status(200).json({
      success: true,
      data: {
        totalScore,
        personalScore,
        professionalScore,
        label,
        personalMissing,
        professionalMissing,
        breakdown: { personal: personalFields.map(f => ({ ...f, done: !!(user[f.field] && user[f.field].toString().trim() !== '') })) },
      },
    });
  } catch (err) {
    console.error('getProfileScore error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute profile score' });
  }
};

// ── PUT /api/profile/notifications ───────────────────────────────────────────
const updateNotifications = async (req, res) => {
  try {
    const { email, push, weekly } = req.body;
    const updates = {};
    if (email  !== undefined) updates['notifications.email']  = email;
    if (push   !== undefined) updates['notifications.push']   = push;
    if (weekly !== undefined) updates['notifications.weekly'] = weekly;
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
    res.status(200).json({ success: true, message: 'Preferences saved!', notifications: user.notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

// ── GET /api/profile/professional ────────────────────────────────────────────
const getProfessionalProfile = async (req, res) => {
  try {
    let profile = await ProfessionalProfile.findOne({ user: req.user.id });
    if (!profile) profile = await ProfessionalProfile.create({ user: req.user.id });
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get professional profile' });
  }
};

// ── POST /api/profile/professional/:section ───────────────────────────────────
const manageProfessionalSection = async (req, res) => {
  try {
    const { section } = req.params;
    const sectionMap = {
      'work':              'workExperience',
      'education':         'education',
      'languages':         'languages',
      'certifications':    'certifications',
      'technical-skills':  'technicalSkills',
      'functional-skills': 'functionalSkills',
      'honors':            'honorsAwards',
    };
    const key = sectionMap[section];
    if (!key) return res.status(400).json({ success: false, message: 'Invalid section' });

    let profile = await ProfessionalProfile.findOne({ user: req.user.id });
    if (!profile) profile = await ProfessionalProfile.create({ user: req.user.id });

    if (req.method === 'POST') {
      profile[key].push(req.body);
    }
    await profile.save();
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update section' });
  }
};

// ── PUT /api/profile/professional/:section/:itemId ────────────────────────────
const updateProfessionalItem = async (req, res) => {
  try {
    const { section, itemId } = req.params;
    const sectionMap = {
      'work': 'workExperience', 'education': 'education',
      'languages': 'languages', 'certifications': 'certifications',
      'technical-skills': 'technicalSkills', 'functional-skills': 'functionalSkills',
      'honors': 'honorsAwards',
    };
    const key = sectionMap[section];
    if (!key) return res.status(400).json({ success: false, message: 'Invalid section' });

    const profile = await ProfessionalProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const item = profile[key].id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    Object.keys(req.body).forEach(k => { item[k] = req.body[k]; });
    profile.markModified(key);
    await profile.save();
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

// ── DELETE /api/profile/professional/:section/:itemId ─────────────────────────
const deleteProfessionalItem = async (req, res) => {
  try {
    const { section, itemId } = req.params;
    const sectionMap = {
      'work': 'workExperience', 'education': 'education',
      'languages': 'languages', 'certifications': 'certifications',
      'technical-skills': 'technicalSkills', 'functional-skills': 'functionalSkills',
      'honors': 'honorsAwards',
    };
    const key = sectionMap[section];
    if (!key) return res.status(400).json({ success: false, message: 'Invalid section' });

    const profile = await ProfessionalProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    profile[key] = profile[key].filter(item => item._id.toString() !== itemId);
    await profile.save();
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

module.exports = {
  updateProfile, uploadAvatar, getProfileScore, updateNotifications,
  getProfessionalProfile, manageProfessionalSection, updateProfessionalItem, deleteProfessionalItem,
};