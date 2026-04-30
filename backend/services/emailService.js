const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email to prize winners
 */
const sendPrizeWonEmail = async (email, name, rank, amount, type) => {
  console.log(`📧 Sending prize email to ${email}...`);
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const period = type === 'weekly' ? 'this week' : 'this month';

  const mailOptions = {
    from: `"JKSSB PrepMaster 🏆" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${medals[rank]} Congratulations! You won ₹${amount}!`,
    html: `
      <div style="font-family:Arial, sans-serif; max-width:500px; margin:auto; padding:20px; border:2px solid #facc15; border-radius:15px; background-color:#0a0a0a; color:#ffffff;">
        <h1 style="color:#facc15; text-align:center;">${medals[rank]} You're Rank #${rank}!</h1>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Incredible work! You ranked <strong>#${rank}</strong> on JKSSB PrepMaster ${period}!</p>
        <div style="background:rgba(250, 204, 21, 0.1); padding:20px; border-radius:12px; text-align:center; margin:20px 0; border:1px border-style:dashed; border-color:#facc15;">
          <h2 style="color:#facc15; margin:0;">Prize: ₹${amount}</h2>
        </div>
        <p>Your prize will be sent to your registered UPI/Bank account within <strong>48 hours</strong>.</p>
        <p>Keep studying daily and win again next ${type === 'weekly' ? 'week' : 'month'}! 💪</p>
        <br/>
        <p style="color:#a3a3a3; font-size:12px; text-align:center;">— Team JKSSB PrepMaster</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Prize email sent to ${email}`);
  } catch (error) {
    console.error('❌ Email Service Error:', error);
  }
};

/**
 * Send OTP for Login
 */
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Medx Prep 🔐" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your verification code`,
    html: `
      <div style="font-family:Arial, sans-serif; max-width:400px; margin:auto; padding:20px; border-radius:15px; background-color:#0a0a0a; color:#ffffff; text-align:center;">
        <h2 style="color:#635BFF;">Verification Code</h2>
        <p>Use the code below to sign in. It expires in <b>30 seconds</b>.</p>
        <h1 style="background:#1C1C26; padding:15px; border-radius:10px; letter-spacing:5px; color:#635BFF;">${otp}</h1>
        <p style="color:#8E8E9F; font-size:12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ OTP Email Error:', error);
  }
};

/**
 * Send Approval Notification
 */
const sendApprovalEmail = async (email, name) => {
  const mailOptions = {
    from: `"JKSSB PrepMaster ✅" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Account is Approved! 🚀`,
    html: `
      <div style="font-family:Arial, sans-serif; max-width:500px; margin:auto; padding:20px; border:1px solid #22c55e; border-radius:15px; background-color:#0a0a0a; color:#ffffff;">
        <h1 style="color:#22c55e; text-align:center;">You're Approved! ✅</h1>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Great news! Your account on <strong>JKSSB PrepMaster</strong> has been reviewed and approved by our administration team.</p>
        <div style="background:rgba(34, 197, 94, 0.1); padding:20px; border-radius:12px; text-align:center; margin:20px 0; border:1px dashed #22c55e;">
          <p style="color:#22c55e; margin:0; font-weight:bold;">You can now log in and start practicing Today's MCQs!</p>
        </div>
        <p>Keep studying and stay consistent. See you on the leaderboard!</p>
        <br/>
        <p style="color:#a3a3a3; font-size:12px; text-align:center;">— Team JKSSB PrepMaster</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${email}`);
  } catch (error) {
    console.error('❌ Approval Email Error:', error);
  }
};

module.exports = { sendPrizeWonEmail, sendOTPEmail, sendApprovalEmail };
