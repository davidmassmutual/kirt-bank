// backend/routes/investments.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const verifyToken = require('../middleware/auth');

// Investment Plans
const PLANS = {
  starter: { name: 'Starter', min: 100, max: 5000, rate: 0.12, term: '3-6 months' },
  growth: { name: 'Growth', min: 5001, max: 25000, rate: 0.18, term: '6-12 months' },
  elite: { name: 'Elite', min: 25001, max: 100000, rate: 0.28, term: '12-24 months' }
};

// GET: All plans
router.get('/plans', (req, res) => {
  res.json(Object.values(PLANS));
});

// POST: Invest
router.post('/invest', verifyToken, async (req, res) => {
  const { plan, amount } = req.body;

  if (!plan || !PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });
  if (!amount || amount < PLANS[plan].min || amount > PLANS[plan].max) {
    return res.status(400).json({ message: `Amount must be $${PLANS[plan].min}–$${PLANS[plan].max}` });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const totalBalance = user.balance.checking + user.balance.savings + user.balance.usdt;
    if (totalBalance < amount) {
      return res.status(400).json({
        message: 'Insufficient balance',
        needsDeposit: true,
        required: amount - totalBalance
      });
    }

    // Deduct from checking
    user.balance.checking -= amount;

    // Create investment record (simplified)
    user.investments = user.investments || [];
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + Math.floor(Math.random() * 6) + 3); // 3-8 months

    user.investments.push({
      plan,
      amount,
      rate: PLANS[plan].rate,
      startDate: new Date(),
      maturityDate: maturity,
      status: 'Active',
      expectedReturn: amount * (1 + PLANS[plan].rate)
    });

    // Transaction
    const tx = new Transaction({
      userId: user._id,
      type: 'investment',
      amount,
      method: 'balance',
      status: 'Completed',
      account: 'checking',
      date: new Date(),
    });
    await tx.save();

    // Notification
    user.notifications.push({
      message: `Investment of $${amount} in ${PLANS[plan].name} Plan confirmed. Expected return: $${(amount * PLANS[plan].rate).toFixed(2)}`,
      type: 'investment',
      date: new Date(),
    });

    await user.save();

    res.json({
      message: 'Investment successful!',
      investment: user.investments[user.investments.length - 1]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;