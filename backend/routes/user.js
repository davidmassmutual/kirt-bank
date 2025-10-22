// backend/routes/user.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');
const verifyToken = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

// Get all users (admin only)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user balances (admin only)
router.put('/:id/balances', verifyToken, isAdmin, async (req, res) => {
  try {
    const { savingsBalance, checkingBalance, usdtBalance } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.savingsBalance = savingsBalance !== undefined ? savingsBalance : user.savingsBalance;
    user.checkingBalance = checkingBalance !== undefined ? checkingBalance : user.checkingBalance;
    user.usdtBalance = usdtBalance !== undefined ? usdtBalance : user.usdtBalance;
    await user.save();
    res.json({ message: 'Balances updated successfully', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    console.error('Error updating balances:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user sessions
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId });
    res.json(sessions.map(session => ({
      id: session._id,
      device: session.device,
      lastActive: session.lastActive,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: 'Email already exists' });
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    await user.save();
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update 2FA
router.put('/2fa', verifyToken, async (req, res) => {
  try {
    const { twoFactor } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.twoFactorEnabled = twoFactor;
    await user.save();
    res.json({ message: '2FA updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notifications
router.put('/notifications', verifyToken, async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.notifications = { email, sms, push };
    await user.save();
    res.json({ message: 'Notifications updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { currency, theme } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.currency = currency;
    user.theme = theme;
    await user.save();
    res.json({ message: 'Preferences updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete session
router.delete('/sessions/:id', verifyToken, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    await session.deleteOne();
    res.json({ message: 'Session terminated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;