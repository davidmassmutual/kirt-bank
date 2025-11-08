// backend/routes/user.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const verifyToken = require('../middleware/auth');

// Middleware: Admin check
const isAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// GET: Current user (token validation)
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: All users (Admin only)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// SEARCH & FILTER: Users (Admin only)
router.get('/search', verifyToken, isAdmin, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select('- Viral')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Search users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Edit user balances
router.put('/:userId/balances', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

  const { checkingBalance, savingsBalance, usdtBalance } = req.body;
  if ([checkingBalance, savingsBalance, usdtBalance].every(v => v === undefined)) {
    return res.status(400).json({ message: 'No balance provided' });
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance.checking = Number(checkingBalance) || user.balance.checking;
    user.balance.savings = Number(savingsBalance) || user.balance.savings;
    user.balance.usdt = Number(usdtBalance) || user.balance.usdt;

    await user.save();

    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: { message: `Updated balance for ${user.name}`, date: new Date(), read: false } } }
    );

    res.json({ message: 'Balance updated', balance: user.balance });
  } catch (err) {
    console.error('Balance update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Bulk actions (delete / update balance)
router.post('/bulk', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

  const { action, userIds, data } = req.body;
  if (!action || !userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  try {
    if (action === 'delete') {
      await User.deleteMany({ _id: { $in: userIds }, isAdmin: false });
      await Transaction.deleteMany({ userId: { $in: userIds } });

      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Bulk deleted ${userIds.length} users`, date: new Date(), read: false } } }
      );

      res.json({ message: 'Users deleted' });
    }

    else if (action === 'updateBalance') {
      const { checking = 0, savings = 0, usdt = 0 } = data.balance || {};

      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $inc: {
            'balance.checking': Number(checking),
            'balance.savings': Number(savings),
            'balance.usdt': Number(usdt),
          },
        }
      );

      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Bulk balance update on ${userIds.length} users`, date: new Date(), read: false } } }
      );

      res.json({ message: 'Balances updated' });
    }

    else {
      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (err) {
    console.error('Bulk error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Admin Notifications
router.get('/notifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('adminNotifications');
    res.json(admin.adminNotifications || []);
  } catch (err) {
    console.error('Fetch admin notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT: Update profile
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

// PUT: Change password
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

// PUT: 2FA toggle
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

// PUT: Notification settings
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

// PUT: Preferences (currency/theme)
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

// DELETE: Session
router.delete('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const Session = require('../models/Session');
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