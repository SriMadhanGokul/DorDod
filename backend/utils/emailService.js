const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const brand = `
  <div style="background:#1A237E;padding:20px 32px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:1px;">DoR-DoD</h1>
    <p style="color:#90CAF9;margin:4px 0 0;font-size:13px;">Your Personal Growth Platform</p>
  </div>
`;

const footer = `
  <div style="background:#f5f5f5;padding:16px 32px;border-radius:0 0 12px 12px;text-align:center;">
    <p style="color:#9E9E9E;font-size:12px;margin:0;">© 2025 DoR-DoD · You received this because you have an account.</p>
  </div>
`;

const wrap = (body) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:40px auto;border-radius:12px;
    box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;background:#fff;">
    ${brand}
    <div style="padding:32px;">${body}</div>
    ${footer}
  </div>
`;

// ── OTP Email ─────────────────────────────────────────────────────────────────
const sendOTPEmail = async (email, otp, name) => {
  await transporter.sendMail({
    from:    `"DoR-DoD Platform" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: '🔐 Your DoR-DoD Verification Code',
    html:    wrap(`
      <h2 style="color:#1A237E;margin:0 0 8px;">Hey ${name}! 👋</h2>
      <p style="color:#555;margin:0 0 24px;">Your verification code is:</p>
      <div style="background:#E8EAF6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:42px;font-weight:800;color:#1A237E;letter-spacing:12px;">${otp}</span>
      </div>
      <p style="color:#757575;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    `),
  });
};

// ── Password Reset Email ───────────────────────────────────────────────────────
const sendResetEmail = async (email, resetUrl, name) => {
  await transporter.sendMail({
    from:    `"DoR-DoD Platform" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: '🔑 Reset Your DoR-DoD Password',
    html:    wrap(`
      <h2 style="color:#1A237E;margin:0 0 8px;">Password Reset Request</h2>
      <p style="color:#555;margin:0 0 24px;">Hi ${name}, click the button below to reset your password. This link expires in 15 minutes.</p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="background:#1A237E;color:#fff;padding:14px 32px;border-radius:8px;
          text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Reset Password</a>
      </div>
      <p style="color:#9E9E9E;font-size:12px;">If you didn't request this, ignore this email.</p>
    `),
  });
};

// ── Course Approved Email ─────────────────────────────────────────────────────
const sendCourseApprovedEmail = async (email, name, courseTitle) => {
  await transporter.sendMail({
    from:    `"DoR-DoD Platform" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `✅ Your course "${courseTitle}" has been approved!`,
    html:    wrap(`
      <h2 style="color:#2E7D32;margin:0 0 8px;">🎉 Course Approved!</h2>
      <p style="color:#555;margin:0 0 16px;">Hey <strong>${name}</strong>! Great news —</p>
      <div style="background:#E8F5E9;border-left:4px solid #4CAF50;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:16px;font-weight:600;color:#2E7D32;">"${courseTitle}"</p>
        <p style="margin:4px 0 0;color:#555;font-size:13px;">is now live in the Learning Library!</p>
      </div>
      <p style="color:#555;">Your course is now visible to all users on the platform. Thank you for contributing to the community!</p>
    `),
  });
};

// ── Course Rejected Email ─────────────────────────────────────────────────────
const sendCourseRejectedEmail = async (email, name, courseTitle, reason) => {
  await transporter.sendMail({
    from:    `"DoR-DoD Platform" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `❌ Course "${courseTitle}" was not approved`,
    html:    wrap(`
      <h2 style="color:#C62828;margin:0 0 8px;">Course Not Approved</h2>
      <p style="color:#555;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="color:#555;margin:0 0 16px;">Unfortunately, your course submission was not approved at this time:</p>
      <div style="background:#FFEBEE;border-left:4px solid #EF5350;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-weight:600;color:#C62828;">"${courseTitle}"</p>
        <p style="margin:8px 0 0;color:#555;font-size:13px;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p style="color:#555;">Please review the feedback and feel free to re-submit an improved version.</p>
    `),
  });
};

// ── Weekly Summary Email ───────────────────────────────────────────────────────
const sendWeeklySummaryEmail = async (email, name, data) => {
  const { goalsCompleted, habitRate, coursesEnrolled, newCourses } = data;
  await transporter.sendMail({
    from:    `"DoR-DoD Platform" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `📊 Your Weekly Progress Summary — DoR-DoD`,
    html:    wrap(`
      <h2 style="color:#1A237E;margin:0 0 4px;">Your Weekly Report 📊</h2>
      <p style="color:#757575;margin:0 0 24px;">Here's how you did this week, <strong>${name}</strong>!</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        ${[
          { icon:'🎯', label:'Goals Completed',   val: goalsCompleted, color:'#E8EAF6' },
          { icon:'🔥', label:'Habit Completion',  val: `${habitRate}%`, color:'#FFF3E0' },
          { icon:'📚', label:'Courses Enrolled',  val: coursesEnrolled, color:'#E8F5E9' },
          { icon:'🆕', label:'New Courses Added', val: newCourses, color:'#FCE4EC' },
        ].map(s => `
          <div style="background:${s.color};border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:28px;">${s.icon}</div>
            <div style="font-size:24px;font-weight:700;color:#1A237E;">${s.val}</div>
            <div style="font-size:11px;color:#757575;">${s.label}</div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;">
        <a href="${process.env.CLIENT_URL}/dashboard"
          style="background:#1A237E;color:#fff;padding:12px 28px;border-radius:8px;
          text-decoration:none;font-weight:600;display:inline-block;">
          Continue Learning →
        </a>
      </div>
    `),
  });
};

// ── Welcome Email ─────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, name) => {
  await transporter.sendMail({
    from:    `"DoR-DoD Platform" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `🚀 Welcome to DoR-DoD, ${name}!`,
    html:    wrap(`
      <h2 style="color:#1A237E;margin:0 0 8px;">Welcome to DoR-DoD! 🚀</h2>
      <p style="color:#555;margin:0 0 20px;">Hi <strong>${name}</strong>, you're all set! Here's how to get started:</p>
      <div style="space-y:12px;">
        ${[
          { step:'1', text:'Choose your Career Path on the Skills page', icon:'🗺️' },
          { step:'2', text:'Set your first Goal to track progress', icon:'🎯' },
          { step:'3', text:'Create a 21-day Habit to build consistency', icon:'🔥' },
          { step:'4', text:'Enroll in courses to start learning', icon:'📚' },
        ].map(s => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#F5F5F5;border-radius:8px;margin-bottom:8px;">
            <div style="width:32px;height:32px;background:#1A237E;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0;">${s.step}</div>
            <span style="color:#555;font-size:14px;">${s.icon} ${s.text}</span>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.CLIENT_URL}/dashboard"
          style="background:#1A237E;color:#fff;padding:14px 32px;border-radius:8px;
          text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Get Started 🚀
        </a>
      </div>
    `),
  });
};

module.exports = {
  sendOTPEmail, sendResetEmail,
  sendCourseApprovedEmail, sendCourseRejectedEmail,
  sendWeeklySummaryEmail, sendWelcomeEmail,
};