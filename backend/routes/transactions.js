// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');

// ───── EMAIL TRANSPORTER (Gmail example) ─────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g. admin@kirtbank.com
    pass: process.env.EMAIL_PASS, // App password
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
    console.error('Email send error:', err);
  }
};

// GET: User transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('User transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: All transactions (Admin only) - with populate for dashboard
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const transactions = await Transaction.find()
      .populate('userId', 'name email phone balance')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    console.error('Admin transactions error:', err);
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

    // User notification + email
    const userMsg = `Your deposit of $${amount} via ${method} is pending approval.`;
    user.notifications.push({ message: userMsg, type: 'deposit', date: new Date() });
    await sendEmail(user.email, 'Deposit Pending', userMsg);
    await user.save();

    // Admin notification + email
    const adminMsg = `New deposit: $${amount} from ${user.name} (${user.email}) via ${method}`;
    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: { message: adminMsg, date: new Date(), read: false } } }
    );

    const admins = await User.find({ isAdmin: true });
    for (const admin of admins) {
      await sendEmail(admin.email, 'New Deposit Alert', adminMsg);
    }

    res.status(201).json({ message: 'Deposit submitted', transaction });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Confirm or Reject deposit (MAIN FIX)
router.put('/admin/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  const { action } = req.body; // 'confirm' or 'reject'

  if (!['confirm', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action must be confirm or reject' });
  }

  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const tx = await Transaction.findById(txId).populate('userId');
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.type !== 'deposit') return res.status(400).json({ message: 'Not a deposit' });
    if (tx.status !== 'Pending') return res.status(400).json({ message: 'Already processed' });

    const user = tx.userId;

    if (action === 'confirm') {
      tx.status = 'Completed'; // ← Changed to "Completed" for user history
      user.balance[tx.account] = (user.balance[tx.account] || 0) + tx.amount;

      const msg = `Your deposit of $${tx.amount} has been CONFIRMED and added to ${tx.account}.`;
      user.notifications.push({ message: msg, type: 'deposit_success', date: new Date() });
      await sendEmail(user.email, 'Deposit Confirmed ✅', msg);

      // Admin audit
      const audit = `Confirmed deposit #${tx._id.slice(-6)} (+$${tx.amount}) for ${user.name}`;
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: audit, date: new Date(), read: false } } }
      );
    } else {
      tx.status = 'Failed';

      const msg = `Your deposit of $${tx.amount} was REJECTED. Please contact support.`;
      user.notifications.push({ message: msg, type: 'deposit_failed', date: new Date() });
      await sendEmail(user.email, 'Deposit Rejected ❌', msg);

      // Admin audit
      const audit = `Rejected deposit #${tx._id.slice(-6)} ($${tx.amount}) for ${user.name}`;
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: audit, date: new Date(), read: false } } }
      );
    }

    await tx.save();
    await user.save();

    res.json({
      message: `Deposit ${action}ed successfully`,
      transaction: tx,
      updatedBalance: user.balance,
    });
  } catch (err) {
    console.error('Admin action error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: User transactions by ID (Admin or self)
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && req.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Add manual transaction (Admin only)
router.post('/user/:userId', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

  const { type, amount, method, status = 'Completed', account = 'checking', date } = req.body;
  if (!type || !amount) return res.status(400).json({ message: 'Type and amount required' });

  try {
    const transaction = new Transaction({
      userId: req.params.userId,
      type,
      amount: parseFloat(amount),
      method,
      status,
      account,
      date: date || new Date(),
    });

    await transaction.save();

    const user = await User.findById(req.params.userId);
    if (user) {
      user.notifications.push({
        message: `Admin added: $${amount} ${type} (${status})`,
        type: 'admin_tx',
        date: new Date(),
      });
      await user.save();
    }

    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE: Transaction (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Not found' });

    await Transaction.deleteOne({ _id: req.params.id });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;