// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET: All transactions (admin only)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    const transactions = await Transaction.find().populate('userId', 'name email').sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Create deposit (user)
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
      method,
      account: account || 'checking',
      status: 'Pending',
      receipt: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await transaction.save();

    // Notify user
    user.notifications.push({
      message: `Deposit of $${amount} via ${method} is pending.`,
      type: 'deposit',
    });

    // Notify ALL admins
    const admins = await User.find({ isAdmin: true });
    const adminNotif = {
      message: `New deposit: $${amount} from ${user.name} (${user.email}) via ${method}`,
      date: new Date(),
      read: false,
    };
    await User.updateMany({ isAdmin: true }, { $push: { adminNotifications: adminNotif } });

    await user.save();
    res.status(201).json({ message: 'Deposit submitted', transaction });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Confirm or Reject deposit
router.put('/admin/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  const { action } = req.body; // 'confirm' or 'reject'
  if (!['confirm', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const tx = await Transaction.findById(txId);
    if (!tx || tx.type !== 'deposit') return res.status(404).json({ message: 'Transaction not found' });

    const user = await User.findById(tx.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (tx.status !== 'Pending') return res.status(400).json({ message: 'Already processed' });

    if (action === 'confirm') {
      tx.status = 'Posted';
      user.balance[tx.account] += tx.amount;

      user.notifications.push({
        message: `Deposit of $${tx.amount} confirmed! Added to ${tx.account}.`,
        type: 'deposit',
      });

      // Log admin action
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Confirmed deposit #${tx._id.slice(-6)} for ${user.name}`, date: new Date() } } }
      );
    } else {
      tx.status = 'Failed';
      user.notifications.push({
        message: `Deposit of $${tx.amount} rejected.`,
        type: 'deposit',
      });

      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Rejected deposit #${tx._id.slice(-6)} for ${user.name}`, date: new Date() } } }
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

module.exports = router;