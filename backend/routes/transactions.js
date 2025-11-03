// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');

// ───── EMAIL SETUP ─────
const transporter = nodemailer.createTransport({
  service: 'gmail',               // or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER, // e.g. admin@kirtbank.com
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Kirt Bank" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (e) {
    console.error('Email error:', e);
  }
};

// ───── USER: Get own transactions ─────
router.get('/', verifyToken, async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(txs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ───── ADMIN: Get ALL transactions (for pending list) ─────
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });
    const txs = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ date: -1 });
    res.json(txs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ───── USER: Submit deposit ─────
router.post('/deposit', verifyToken, upload.single('receipt'), async (req, res) => {
  const { amount, method, account } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tx = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount: parseFloat(amount),
      method: method || 'bank',
      account: account || 'checking',
      status: 'Pending',
      receipt: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await tx.save();

    // USER NOTIFICATION + EMAIL
    const userMsg = `Your $${amount} ${method} deposit is pending approval.`;
    user.notifications.push({ message: userMsg, type: 'deposit', date: new Date() });
    await user.save();

    await sendMail(user.email, 'Deposit Received', userMsg);

    // ADMIN NOTIFICATION + EMAIL
    const adminMsg = `New deposit: $${amount} from ${user.name} (${user.email}) via ${method}`;
    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: { message: adminMsg, date: new Date(), read: false } } }
    );
    const adminUsers = await User.find({ isAdmin: true }).select('email');
    for (const a of adminUsers) await sendMail(a.email, 'New Deposit', adminMsg);

    res.status(201).json({ message: 'Deposit submitted', transaction: tx });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ───── ADMIN: Confirm / Reject deposit ─────
router.put('/admin/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  const { action } = req.body; // 'confirm' or 'reject'

  if (!['confirm', 'reject'].includes(action))
    return res.status(400).json({ message: 'action must be confirm or reject' });

  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

    const tx = await Transaction.findById(txId).populate('userId');
    if (!tx) return res.status(404).json({ message: 'Tx not found' });
    if (tx.type !== 'deposit') return res.status(400).json({ message: 'Not a deposit' });
    if (tx.status !== 'Pending') return res.status(400).json({ message: 'Already processed' });

    const user = tx.userId;

    if (action === 'confirm') {
      tx.status = 'Posted';
      user.balance[tx.account] += tx.amount;

      const msg = `Your $${tx.amount} deposit has been CONFIRMED and added to ${tx.account}.`;
      user.notifications.push({ message: msg, type: 'deposit', date: new Date() });
      await sendMail(user.email, 'Deposit Confirmed', msg);
    } else {
      tx.status = 'Failed';
      const msg = `Your $${tx.amount} deposit was REJECTED.`;
      user.notifications.push({ message: msg, type: 'deposit', date: new Date() });
      await sendMail(user.email, 'Deposit Rejected', msg);
    }

    // ADMIN AUDIT
    const audit = `${action === 'confirm' ? 'Confirmed' : 'Rejected'} deposit #${tx._id.slice(-6)} for ${user.name}`;
    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: { message: audit, date: new Date(), read: false } } }
    );

    await tx.save();
    await user.save();

    res.json({ message: `Deposit ${action}ed`, transaction: tx });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
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