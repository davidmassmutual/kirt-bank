// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');

// Nodemailer v7+ fix
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Kirt Bank" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Email failed:', err.message);
  }
};

// GET: User transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('User tx error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: All transactions (Admin)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    const transactions = await Transaction.find()
      .populate('userId', 'name email phone')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('Admin tx error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Create deposit (Pending)
router.post('/deposit', verifyToken, upload.single('receipt'), async (req, res) => {
  const { amount, method, account } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transaction = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount: parseFloat(amount),
      method: method || 'bank',
      account: account || 'checking',
      status: 'Pending',
      date: new Date(),
      receipt: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await transaction.save();

    // Notify user
    user.notifications.push({
      message: `Deposit of $${amount} via ${method} is pending approval.`,
      type: 'deposit',
      date: new Date(),
    });

    // Notify ALL admins
    const adminNotif = {
      message: `New deposit: $${amount} from ${user.name} (${user.email}) via ${method}`,
      date: new Date(),
      read: false,
    };
    await User.updateMany({ isAdmin: true }, { $push: { adminNotifications: adminNotif } });

    await user.save();

    // Send emails
    await sendEmail(user.email, 'Deposit Pending', `Your $${amount} deposit is pending.`);
    const admins = await User.find({ isAdmin: true }).select('email');
    for (const admin of admins) {
      await sendEmail(admin.email, 'New Deposit Alert', adminNotif.message);
    }

    res.status(201).json({ message: 'Deposit submitted', transaction });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Confirm or Reject deposit (100% FIXED)
router.put('/admin/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  let { action } = req.body;

  if (typeof action === 'string') {
    action = action.toLowerCase().replace(/\s+/g, '');
  }

  if (action !== 'confirm' && action !== 'reject') {
    return res.status(400).json({ message: 'Invalid action. Must be "confirm" or "reject"' });
  }

  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const tx = await Transaction.findById(txId).populate('userId');
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.type !== 'deposit') return res.status(400).json({ message: 'Not a deposit' });
    if (tx.status !== 'Pending') return res.status(400).json({ message: 'Already processed' });

    const user = tx.userId;

    if (action === 'confirm') {
      tx.status = 'Posted';
      user.balance[tx.account] = (user.balance[tx.account] || 0) + tx.amount;

      const userMsg = `Your $${tx.amount.toFixed(2)} deposit has been CONFIRMED!`;
      user.notifications.push({ message: userMsg, type: 'deposit', date: new Date() });
      await sendEmail(user.email, 'Deposit Confirmed ✅', userMsg);

      const audit = `Confirmed deposit #${tx._id.slice(-6)} for ${user.name} (+$${tx.amount})`;
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: audit, date: new Date(), read: false } } }
      );
    } else {
      tx.status = 'Failed';
      const userMsg = `Your $${tx.amount.toFixed(2)} deposit was REJECTED.`;
      user.notifications.push({ message: userMsg, type: 'deposit', date: new Date() });
      await sendEmail(user.email, 'Deposit Rejected ❌', userMsg);

      const audit = `Rejected deposit #${tx._id.slice(-6)} for ${user.name}`;
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: audit, date: new Date(), read: false } } }
      );
    }

    await tx.save();
    await user.save();

    res.json({ message: `Deposit ${action}ed`, transaction: tx });
  } catch (err) {
    console.error('Admin action error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET: User transactions by ID (Admin)
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && req.userId !== req.params.userId) return res.status(403).json({ message: 'Unauthorized' });
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Add transaction for user (Admin only)
router.post('/user/:userId', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

  const { type, amount, method, status, account, date } = req.body;
  if (!type || !amount) return res.status(400).json({ message: 'Type and amount required' });

  try {
    const transaction = new Transaction({
      userId: req.params.userId,
      type,
      amount: parseFloat(amount),
      method,
      status: status || 'Posted',
      account: account || 'checking',
      date: date || new Date(),
    });

    await transaction.save();

    const user = await User.findById(req.params.userId);
    if (user) {
      user.notifications.push({
        message: `New transaction: $${amount} (${type})`,
        type: 'transaction',
        date: new Date(),
      });
      await user.save();
    }

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE: User transaction (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Not found' });

    await tx.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;