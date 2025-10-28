// backend/routes/loans.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET: Fetch current loan offer + balance + ID/SSN status
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
    console.error('Fetch loan data error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Generate or accept loan offer
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 2000 || amount > 15000) {
      return res.status(400).json({ message: 'Loan amount must be between $2,000 and $15,000' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If user already has an offer and is trying to accept it
    if (user.loanOffer && amount === user.loanOffer) {
      const totalBalance = user.balance.checking + user.balance.savings + user.balance.usdt;
      if (totalBalance < 200) {
        return res.status(400).json({
          message: 'Minimum account balance of $200 required to accept a loan. Please contact customer care at support@kirtbank.com or 1-800-KIRT-BANK for more information.',
        });
      }

      // Loan accepted — add notification
      user.notifications.push({
        message: `Loan of $${amount} accepted and processing`,
        date: new Date(),
      });
      await user.save();

      return res.json({ message: 'Loan application submitted successfully!', amount });
    }

    // Otherwise: Generate new offer (only if none exists)
    if (!user.loanOffer) {
      user.loanOffer = amount;
      user.notifications.push({
        message: `New loan offer: $${amount} pre-approved`,
        date: new Date(),
      });
      await user.save();
      return res.json({ message: 'Loan offer generated', amount });
    }

    // Offer already exists
    res.json({ message: 'You already have a loan offer', amount: user.loanOffer });
  } catch (err) {
    console.error('Loan apply error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Increase offer by submitting ID & SSN
router.post('/update-offer', verifyToken, upload.single('idDocument'), async (req, res) => {
  try {
    const { ssn } = req.body;
    if (!ssn || !req.file) {
      return res.status(400).json({ message: 'SSN and ID document are required' });
    }

    // Basic SSN format check
    if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
      return res.status(400).json({ message: 'Invalid SSN format. Use XXX-XX-XXXX' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate higher offer
    const newAmount = Math.floor(Math.random() * (15000 - 3000 + 1)) + 3000;

    user.loanOffer = newAmount;
    user.hasSubmittedIdSsn = true;
    user.idDocument = req.file.path;
    user.ssn = ssn;

    user.notifications.push({
      message: `Loan offer increased to $${newAmount} after ID verification`,
      date: new Date(),
    });

    await user.save();

    res.json({ message: 'Loan offer increased!', amount: newAmount });
  } catch (err) {
    console.error('Update offer error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;