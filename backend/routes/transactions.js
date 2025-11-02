// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// GET: User transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Create deposit (Pending)
router.post('/deposit', verifyToken, async (req, res) => {
  const { amount, method = 'bank' } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  try {
    const user = await User.findById(req.userId);
    const transaction = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount,
      method,
      status: 'Pending',
      date: new Date(),
    });

    await transaction.save();
    user.notifications.push({
      message: `Deposit of $${amount} is pending approval.`,
      type: 'deposit',
    });

    await user.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Confirm or Fail deposit
router.put('/admin/confirm/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  const { action } = req.body; // 'confirm' or 'fail'
  if (!['confirm', 'fail'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

  try {
    const admin = await User.findById(req.userId);
    if (!admin.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const tx = await Transaction.findById(txId);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    const user = await User.findById(tx.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (tx.status !== 'Pending') return res.status(400).json({ message: 'Transaction already processed' });

    if (action === 'confirm') {
      tx.status = 'Posted';
      user.balance.checking += tx.amount;
      user.notifications.push({
        message: `Deposit of $${tx.amount} confirmed and added to your account.`,
        type: 'deposit',
      });
    } else {
      tx.status = 'Failed';
      user.notifications.push({
        message: `Deposit of $${tx.amount} failed. Please try again.`,
        type: 'deposit',
      });
    }

    await tx.save();
    await user.save();
    res.json({ message: `Transaction ${action}ed`, transaction: tx });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;