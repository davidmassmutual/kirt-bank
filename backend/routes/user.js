// backend/routes/user.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = name;
    user.email = email;
    user.phone = phone || '';
    user.address = address || '';
    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/2fa', verifyToken, async (req, res) => {
  try {
    const { twoFactor } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.twoFactorEnabled = twoFactor;
    await user.save();
    res.json({ message: `Two-Factor Authentication ${twoFactor ? 'enabled' : 'disabled'}` });
  } catch (err) {
    console.error('2FA update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notifications', verifyToken, async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.notificationsSettings = { email, sms, push };
    await user.save();
    res.json({ message: 'Notification preferences updated' });
  } catch (err) {
    console.error('Notifications update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { currency, theme } = req.body;
    if (!['USD', 'EUR', 'GBP'].includes(currency) || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({ message: 'Invalid currency or theme' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.currency = currency;
    user.theme = theme;
    await user.save();
    res.json({ message: 'Preferences updated' });
  } catch (err) {
    console.error('Preferences update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    await session.deleteOne();
    res.json({ message: 'Session terminated' });
  } catch (err) {
    console.error('Session deletion error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;