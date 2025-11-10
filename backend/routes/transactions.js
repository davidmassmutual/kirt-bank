// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');

// Email setup
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
    console.error('Email error:', err);
  }
};

// GET user transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all transactions (Admin)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });
    const transactions = await Transaction.find()
      .populate('userId', 'name email phone balance')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST deposit (Pending)
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
      message: `Deposit $${amount} pending`,
      type: 'deposit',
      date: new Date(),
    });
    await sendEmail(user.email, 'Deposit Pending', `Your $${amount} deposit is pending approval.`);

    // Notify admins
    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: { message: `New deposit $${amount} from ${user.name}`, date: new Date(), read: false } } }
    );

    await user.save();
    res.status(201).json({ message: 'Deposit submitted', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Confirm/Reject deposit (100% FIXED)
router.put('/admin/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  const { action } = req.body;

  if (!['confirm', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

    const tx = await Transaction.findById(txId);
    if (!tx || tx.type !== 'deposit' || tx.status !== 'Pending') {
      return res.status(400).json({ message: 'Invalid transaction' });
    }

    const user = await User.findById(tx.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'confirm') {
      tx.status = 'Completed';
      user.balance[tx.account] = (user.balance[tx.account] || 0) + tx.amount;

      user.notifications.push({
        message: `Deposit $${tx.amount} confirmed!`,
        type: 'deposit_success',
        date: new Date(),
      });
      await sendEmail(user.email, 'Deposit Confirmed ✅', `Your deposit of $${tx.amount} has been approved.`);

      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Confirmed deposit #${tx._id.slice(-6)} +$${tx.amount} for ${user.name}`, date: new Date() } } }
      );
    } else {
      tx.status = 'Failed';
      user.notifications.push({
        message: `Deposit $${tx.amount} rejected`,
        type: 'deposit_failed',
        date: new Date(),
      });
      await sendEmail(user.email, 'Deposit Rejected ❌', `Your deposit of $${tx.amount} was rejected.`);

      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Rejected deposit #${tx._id.slice(-6)} $${tx.amount} for ${user.name}`, date: new Date() } } }
      );
    }

    await tx.save();
    await user.save();

    res.json({
      message: `Deposit ${action}ed`,
      transaction: tx,
      user: { _id: user._id, balance: user.balance },
    });
  } catch (err) {
    console.error('Admin action error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Other routes (user tx, add tx, delete)
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && req.userId !== req.params.userId) return res.status(403).json({ message: 'Unauthorized' });
    const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/user/:userId', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });
  const { type, amount, method, status = 'Completed', account = 'checking', date } = req.body;

  try {
    const transaction = new Transaction({
      userId: req.params.userId,
      type, amount: parseFloat(amount), method, status, account,
      date: date || new Date(),
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });
  try {
    await Transaction.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;