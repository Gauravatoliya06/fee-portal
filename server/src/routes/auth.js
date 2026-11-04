import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Student } from '../models/index.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncH, HttpError } from '../utils.js';
import { sendPasswordResetOtp } from '../services/email.js';

const router = Router();
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/login', asyncH(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Incorrect email or password.');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, asyncH(async (req, res) => {
  const out = publicUser(req.user);
  if (req.user.role === 'student') {
    const s = await Student.findOne({ user: req.user._id });
    if (s) Object.assign(out, { rollNo: s.rollNo, course: s.course });
  }
  res.json(out);
}));

router.post('/change-password', requireAuth, asyncH(async (req, res) => {
  const { currentPassword = '', newPassword = '' } = req.body;
  if (newPassword.length < 8) throw new HttpError(400, 'Use at least 8 characters for the new password.');
  if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) throw new HttpError(400, 'Your current password is incorrect.');
  req.user.passwordHash = await bcrypt.hash(newPassword, 10);
  await req.user.save();
  res.json({ message: 'Password changed.' });
}));

// Request 6-digit OTP for registered college email
router.post('/forgot-password', asyncH(async (req, res) => {
  const { email = '' } = req.body;
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) throw new HttpError(400, 'Please enter your registered college email address.');

  const user = await User.findOne({ email: cleanEmail });
  if (!user || !user.active) {
    throw new HttpError(404, 'No active account found with this registered college email.');
  }

  // Generate 6-digit verification code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordOtp = otp;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
  await user.save();

  const emailRes = await sendPasswordResetOtp({
    to: user.email,
    name: user.name,
    otp,
    schoolName: process.env.SCHOOL_NAME,
  });

  res.json({
    message: `A 6-digit verification code has been sent to ${user.email}.`,
    devOtp: emailRes?.mode === 'simulated' ? otp : undefined,
  });
}));

// Verify entered 6-digit OTP
router.post('/verify-otp', asyncH(async (req, res) => {
  const { email = '', otp = '' } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
    throw new HttpError(400, 'Invalid verification code. Please check and try again.');
  }
  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new HttpError(400, 'Verification code has expired. Please request a new one.');
  }
  res.json({ valid: true, message: 'Verification code confirmed.' });
}));

// Reset password with verified OTP
router.post('/reset-password', asyncH(async (req, res) => {
  const { email = '', otp = '', newPassword = '' } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new HttpError(400, 'New password must be at least 8 characters long.');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
    throw new HttpError(400, 'Invalid verification code.');
  }
  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new HttpError(400, 'Verification code has expired. Please request a new one.');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordOtp = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password has been reset successfully! You can now sign in with your new password.' });
}));

export default router;
