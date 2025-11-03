// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET: User transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('userId', 'name email') // Optional populate
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('User transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: All transactions (Admin only)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    const transactions = await Transaction.find()
      .populate('userId', 'name email phone')
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

    // Notify user
    user.notifications.push({
      message: `Deposit of $${amount} via ${method} is pending approval.`,
      type: 'deposit',
      date: new Date(),
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
        date: new Date(),
      });

      // Log admin action
      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Confirmed deposit #${tx._id.slice(-6)} for ${user.name}`, date: new Date(), read: false } } }
      );
    } else {
      tx.status = 'Failed';
      user.notifications.push({
        message: `Deposit of $${tx.amount} rejected.`,
        type: 'deposit',
        date: new Date(),
      });

      await User.updateMany(
        { isAdmin: true },
        { $push: { adminNotifications: { message: `Rejected deposit #${tx._id.slice(-6)} for ${user.name}`, date: new Date(), read: false } } }
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