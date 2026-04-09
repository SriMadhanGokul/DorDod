const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const OTP      = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const { sendOTPEmail, sendResetEmail } = require('../utils/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  };
  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true, message, user: sanitizeUser(user),
  });
};

// ─── STEP 1: Send OTP ─────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name)
      return res.status(400).json({ success: false, message: 'Name and email are required' });

    // Check if email already registered
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please sign in instead.',
        alreadyExists: true,
      });

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email: email.toLowerCase() });
    await OTP.create({ email: email.toLowerCase(), otp, name, expiresAt });
    await sendOTPEmail(email, otp, name);

    res.status(200).json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    console.error('sendOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// ─── STEP 2: Verify OTP ───────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const record = await OTP.findOne({ email: email.toLowerCase() });

    if (!record)
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });

    if (new Date() > record.expiresAt)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    if (record.otp !== otp.toString())
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });

    record.verified = true;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Email verified! Please set your password.',
      name: record.name,
      email: record.email,
    });
  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
};

// ─── STEP 3: Set Password (complete registration) ─────────────────────────────
const setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const record = await OTP.findOne({ email: email.toLowerCase(), verified: true });
    if (!record)
      return res.status(400).json({ success: false, message: 'Email not verified. Please verify OTP first.' });

    const user = await User.create({ name: record.name, email: record.email, password });
    await OTP.deleteMany({ email: email.toLowerCase() });

    sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to SkillSpark 🚀');
  } catch (error) {
    console.error('setPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const record = await OTP.findOne({ email: email.toLowerCase() });
    if (!record)
      return res.status(400).json({ success: false, message: 'No OTP request found. Please start registration again.' });

    const otp = generateOTP();
    record.otp       = otp;
    record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    record.verified  = false;
    await record.save();
    await sendOTPEmail(email, otp, record.name);

    res.status(200).json({ success: true, message: `New OTP sent to ${email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // Google-only user trying to login with password
    if (user.isGoogleUser && !user.hasPassword)
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please set a password first or use Google login.',
        needsPassword: true,
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    sendTokenResponse(user, 200, res, 'Welcome back!');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ─── Get current user ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Google OAuth callback ────────────────────────────────────────────────────
const googleCallback = (req, res) => {
  try {
    const user  = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    const cookieOptions = {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    };
    res.cookie('token', token, cookieOptions);

    // If new Google user — redirect to setup password page
    if (!user.hasPassword) {
      return res.redirect(`${process.env.CLIENT_URL}/setup-password?uid=${user._id}`);
    }

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
  }
};

// ─── Setup Password (for Google users) ───────────────────────────────────────
// POST /api/auth/setup-password
const setupPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.user.id).select('+password');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    user.password   = password;
    user.hasPassword = true;
    await user.save();

    res.status(200).json({ success: true, message: 'Password set successfully! You can now login with email too.' });
  } catch (error) {
    console.error('setupPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to set password.' });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent.' });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordReset.deleteMany({ email: email.toLowerCase() });
    await PasswordReset.create({ email: email.toLowerCase(), token, expiresAt });

    const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendResetEmail(email, user.name, resetURL);

    res.status(200).json({ success: true, message: 'Password reset link sent to your email!' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset email.' });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const record = await PasswordReset.findOne({ email: email.toLowerCase(), token, used: false });
    if (!record)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });

    if (new Date() > record.expiresAt)
      return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    user.password    = password;
    user.hasPassword = true;
    await user.save();

    record.used = true;
    await record.save();

    res.status(200).json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

const sanitizeUser = (user) => ({
  id: user._id, name: user.name, email: user.email,
  firstName: user.firstName, lastName: user.lastName,
  preferredFullName: user.preferredFullName,
  avatar: user.avatar, bio: user.bio,
  subscription: user.subscription, notifications: user.notifications,
  hasPassword: user.hasPassword, isGoogleUser: user.isGoogleUser,
  role:      user.role      || 'user',
  suspended: user.suspended || false,
});

module.exports = {
  sendOTP, verifyOTP, setPassword, resendOTP,
  login, logout, getMe,
  setupPassword,
  forgotPassword, resetPassword,
  googleCallback,
};