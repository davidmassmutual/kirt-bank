// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const session = new Session({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Unknown',
    });
    await session.save();
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isAdmin: true });
    if (!user) return res.status(400).json({ message: 'Invalid admin credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid admin credentials' });
    const token = jwt.sign({ userId: user._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const session = new Session({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Unknown',
    });
    await session.save();
    res.json({ token });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: '',
      address: '',
      twoFactorEnabled: false,
      notifications: { email: true, sms: false, push: true },
      currency: 'USD',
      theme: 'light',
      savingsBalance: 115097000,
      checkingBalance: 508890,
      usdtBalance: 15000,
    });
    await user.save();

    // Create default transactions
    const transactions = [
      { date: new Date('2025-10-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-09-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-08-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-07-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-06-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
    ];

    for (const tx of transactions) {
      const transaction = new Transaction({
        userId: user._id,
        type: tx.type,
        amount: tx.amount,
        method: tx.method,
        status: tx.status,
        date: tx.date,
      });
      await transaction.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const session = new Session({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Unknown',
    });
    await session.save();
    res.json({ token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;