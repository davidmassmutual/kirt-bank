// backend/routes/loans.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('loanOffer hasSubmittedIdSsn balance');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      loanOffer: user.loanOffer,
      hasSubmittedIdSsn: user.hasSubmittedIdSsn,
      balance: user.balance,
    });
  } catch (err) {
    console.error('Fetch loan offer error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 2000 || amount > 15000) {
      return res.status(400).json({ message: 'Loan amount must be between $2,000 and $15,000' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check minimum balance
    if (user.balance.checking < 200 && user.balance.savings < 200 && user.balance.usdt < 200) {
      return res.status(400).json({
        message: 'Minimum account balance of $200 required for a loan. Please contact customer care at support@kirtbank.com or 1-800-KIRT-BANK for more information.',
      });
    }

    // Store loan offer if not already set
    if (!user.loanOffer) {
      user.loanOffer = amount;
      user.notifications.push({
        message: `Loan application for $${amount} submitted`,
        date: new Date(),
      });
      await user.save();
    }

    res.status(201).json({ message: 'Loan application submitted', amount });
  } catch (err) {
    console.error('Loan application error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/update-offer', verifyToken, upload.single('idDocument'), async (req, res) => {
  try {
    const { ssn } = req.body;
    if (!ssn || !req.file) {
      return res.status(400).json({ message: 'SSN and ID document are required' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate new loan offer in higher range
    const newAmount = Math.floor(Math.random() * (15000 - 3000 + 1)) + 3000;
    user.loanOffer = newAmount;
    user.hasSubmittedIdSsn = true;
    user.idDocument = req.file.path;
    user.ssn = ssn;
    user.notifications.push({
      message: `Loan offer updated to $${newAmount} after ID/SSN submission`,
      date: new Date(),
    });
    await user.save();

    res.json({ message: 'Loan offer updated', amount: newAmount });
  } catch (err) {
    console.error('Update loan offer error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;