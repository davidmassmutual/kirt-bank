// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');

// ───── EMAIL TRANSPORTER (Gmail or SMTP) ─────
const transporter = nodemailer.createTransporter({
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

// ───── GET: User transactions ─────
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

// ───── GET: All transactions (Admin) ─────
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

// ───── POST: Submit deposit (Pending) ─────
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
      date: new Date(),
      receipt: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await tx.save();

    // ── USER NOTIFICATION + EMAIL ──
    const userMsg = `Your $${amount} ${method} deposit is pending approval.`;
    user.notifications.push({ message: userMsg, type: 'deposit', date: new Date() });
    await sendEmail(user.email, 'Deposit Pending', userMsg);

    // ── ADMIN NOTIFICATION + EMAIL (ALL ADMINS) ──
    const adminMsg = `New deposit: $${amount} from ${user.name} (${user.email}) via ${method}`;
    const adminNotif = { message: adminMsg, date: new Date(), read: false };

    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: adminNotif } }
    );

    const admins = await User.find({ isAdmin: true }).select('email');
    for (const admin of admins) {
      await sendEmail(admin.email, 'New Deposit Alert', adminMsg);
    }

    await user.save();
    res.status(201).json({ message: 'Deposit submitted', transaction: tx });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ───── ADMIN: Confirm / Reject deposit ─────
router.put('/admin/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  const { action } = req.body;
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
      tx.status = 'Posted';
      user.balance[tx.account] = (user.balance[tx.account] || 0) + tx.amount;

      const userMsg = `Your $${tx.amount} deposit has been CONFIRMED and added to ${tx.account}.`;
      user.notifications.push({ message: userMsg, type: 'deposit', date: new Date() });
      await sendEmail(user.email, 'Deposit Confirmed', userMsg);

      const adminAudit = `Confirmed deposit #${tx._id.slice(-6)} for ${user.name}`;
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: adminAudit, date: new Date(), read: false } } }
      );
    } else {
      tx.status = 'Failed';
      const userMsg = `Your $${tx.amount} deposit was REJECTED.`;
      user.notifications.push({ message: userMsg, type: 'deposit', date: new Date() });
      await sendEmail(user.email, 'Deposit Rejected', userMsg);

      const adminAudit = `Rejected deposit #${tx._id.slice(-6)} for ${user.name}`;
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: adminAudit, date: new Date(), read: false } } }
      );
    }

    await tx.save();
    await user.save();

    res.json({ message: `Deposit ${action}ed`, transaction: tx });
  } catch (err) {
    console.error('Admin action error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ───── GET: User transactions (Admin or self) ─────
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const isSelf = req.userId === req.params.userId;
    if (!req.isAdmin && !isSelf) return res.status(403).json({ message: 'Unauthorized' });

    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('User tx fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ───── POST: Add transaction (Admin only) ─────
router.post('/user/:userId', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

  const { type, amount, method, status = 'Posted', account = 'checking', date } = req.body;
  if (!type || !amount) return res.status(400).json({ message: 'Type and amount required' });

  try {
    const tx = new Transaction({
      userId: req.params.userId,
      type,
      amount: parseFloat(amount),
      method,
      status,
      account,
      date: date ? new Date(date) : new Date(),
    });

    await tx.save();

    const user = await User.findById(req.params.userId);
    if (user) {
      user.notifications.push({
        message: `Admin added: $${amount} ${type}`,
        type: 'admin_tx',
        date: new Date(),
      });
      await user.save();
    }

    res.status(201).json(tx);
  } catch (err) {
    console.error('Add tx error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ───── DELETE: Transaction (Admin only) ─────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    await tx.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete tx error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;