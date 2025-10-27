// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

const isAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalName)),
});
const upload = multer({ storage });

// Get transactions for a specific user (admin only)
router.get('/user/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId });
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching user transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add transaction for a specific user (admin only)
router.post('/user/:userId', verifyToken, isAdmin, upload.single('receipt'), async (req, res) => {
  try {
    const { type, amount, method, status, date, account } = req.body;
    const transaction = new Transaction({
      userId: req.params.userId,
      type,
      amount,
      method,
      status: status || 'Posted',
      account: account || 'checking',
      date: date ? new Date(date) : new Date(),
      receipt: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await transaction.save();
    const user = await User.findById(req.params.userId);
    if (user) {
      user.transactions.push(transaction._id);
      user.notifications.push({
        message: `New ${type} transaction of $${amount.toFixed(2)} added to ${account}`,
        date: new Date()
      });
      await user.save();
    }
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ message: 'Failed to add transaction' });
  }
});

// Update transaction (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { type, amount, method, status, date, account } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    transaction.type = type || transaction.type;
    transaction.amount = amount !== undefined ? amount : transaction.amount;
    transaction.method = method || transaction.method;
    transaction.status = status || transaction.status;
    transaction.account = account || transaction.account;
    transaction.date = date ? new Date(date) : transaction.date;
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ message: 'Failed to update transaction' });
  }
});

// Delete transaction (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    await transaction.deleteOne();
    const user = await User.findById(transaction.userId);
    if (user) {
      user.transactions = user.transactions.filter(tx => tx.toString() !== transaction._id.toString());
      await user.save();
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

// Get user transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('Fetching transactions for user:', req.userId);
    const transactions = await Transaction.find({ userId: req.userId });
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add user transaction (deposit)
router.post('/deposit', verifyToken, async (req, res) => {
  try {
    const { amount, account, method } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance[account] += parseFloat(amount);
    const transaction = new Transaction({
      userId: user._id,
      type: 'deposit',
      amount: parseFloat(amount),
      account,
      method,
      status: 'Posted',
      date: new Date()
    });
    await transaction.save();
    user.transactions.push(transaction._id);
    user.notifications.push({
      message: `Deposited $${parseFloat(amount).toFixed(2)} to ${account} via ${method}`,
      date: new Date()
    });
    await user.save();
    res.status(201).json({ message: 'Deposit successful', transaction });
  } catch (err) {
    console.error('Error processing deposit:', err);
    res.status(500).json({ message: 'Failed to process deposit' });
  }
});

// Add user transaction (general)
router.post('/', verifyToken, upload.single('receipt'), async (req, res) => {
  try {
    const { type, amount, method, status, account } = req.body;
    const transaction = new Transaction({
      userId: req.userId,
      type,
      amount,
      method,
      status: status || 'Posted',
      account: account || 'checking',
      date: new Date(),
      receipt: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await transaction.save();
    const user = await User.findById(req.userId);
    if (user) {
      user.transactions.push(transaction._id);
      user.notifications.push({
        message: `New ${type} transaction of $${parseFloat(amount).toFixed(2)} added to ${account}`,
        date: new Date()
      });
      await user.save();
    }
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error saving transaction:', err);
    res.status(500).json({ message: 'Failed to save transaction' });
  }
});

module.exports = router;