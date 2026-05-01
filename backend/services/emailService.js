const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Initialize SendGrid if key exists (For Production)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('📧 SendGrid initialized for Production Emails');
}

// Nodemailer Fallback (For local dev)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  family: 4, // Force IPv4 to avoid ENETUNREACH errors on Render
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Universal Send Email Function
 * Uses SendGrid if API key is present, otherwise falls back to Nodemailer
 */
const sendMailUniversal = async (mailOptions) => {
  try {
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid format requires 'from' to be verified in SendGrid
      const msg = {
        to: mailOptions.to,
        from: mailOptions.from, 
        subject: mailOptions.subject,
        html: mailOptions.html,
      };
      await sgMail.send(msg);
      return true;
    } else {
      // Nodemailer format
      await transporter.sendMail(mailOptions);
      return true;
    }
  } catch (error) {
    console.error('❌ Email Sending Error:', error.response ? error.response.body : error);
    return false;
  }
};

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

  const success = await sendMailUniversal(mailOptions);
  if (success) console.log(`✅ Prize email sent to ${email}`);
};

/**
 * Send OTP for Login
 */
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"JKSSB PrepMaster 🔐" <${process.env.EMAIL_USER}>`,
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

  await sendMailUniversal(mailOptions);
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

  const success = await sendMailUniversal(mailOptions);
  if (success) console.log(`✅ Approval email sent to ${email}`);
};

module.exports = { sendPrizeWonEmail, sendOTPEmail, sendApprovalEmail };
