const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Send OTP Email ───────────────────────────────────────────────────────────
const sendOTPEmail = async (email, otp, name) => {
  await transporter.sendMail({
    from: `"SkillSpark" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your SkillSpark Verification Code",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f5f5f5;border-radius:12px;">
        <div style="background:#1A237E;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#F9A825;margin:0;font-size:24px;">SkillSpark</h1>
        </div>
        <h2 style="color:#1F2937;">Hi ${name || "there"} 👋</h2>
        <p style="color:#6B7280;">Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#1A237E;color:#fff;font-size:36px;font-weight:bold;letter-spacing:10px;text-align:center;padding:24px;border-radius:8px;margin:24px 0;">
          ${otp}
        </div>
        <p style="color:#6B7280;font-size:13px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

// ─── Send Password Reset Email ────────────────────────────────────────────────
const sendResetEmail = async (email, name, resetURL) => {
  await transporter.sendMail({
    from: `"SkillSpark" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your SkillSpark Password",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f5f5f5;border-radius:12px;">
        <div style="background:#1A237E;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#F9A825;margin:0;font-size:24px;">SkillSpark</h1>
        </div>
        <h2 style="color:#1F2937;">Hi ${name || "there"} 👋</h2>
        <p style="color:#6B7280;">Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetURL}" style="background:#1A237E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
            Reset Password
          </a>
        </div>
        <p style="color:#6B7280;font-size:13px;">Or copy this link: <a href="${resetURL}" style="color:#1A237E;">${resetURL}</a></p>
        <p style="color:#6B7280;font-size:13px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail, sendResetEmail };
