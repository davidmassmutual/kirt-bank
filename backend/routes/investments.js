// backend/routes/investments.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const verifyToken = require('../middleware/auth');

// === INVESTMENT PLANS ===
const PLANS = {
  starter: { 
    name: 'Starter', 
    min: 100, 
    max: 5000, 
    rate: 0.12, 
    term: '3-6 months',
    color: 'from-emerald-500 to-teal-600'
  },
  growth: { 
    name: 'Growth', 
    min: 5001, 
    max: 25000, 
    rate: 0.18, 
    term: '6-12 months',
    color: 'from-blue-500 to-indigo-600'
  },
  elite: { 
    name: 'Elite', 
    min: 25001, 
    max: 100000, 
    rate: 0.28, 
    term: '12-24 months',
    color: 'from-amber-500 to-orange-600'
  }
};

// === GET: All Plans ===
router.get('/plans', (req, res) => {
  try {
    const plans = Object.values(PLANS).map(plan => ({
      ...plan,
      roi: (plan.rate * 100).toFixed(0)
    }));
    res.json(plans);
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === POST: Invest ===
router.post('/invest', verifyToken, async (req, res) => {
  const { plan: planKey, amount } = req.body;

  if (!planKey || !PLANS[planKey]) {
    return res.status(400).json({ message: 'Invalid plan selected' });
  }

  const plan = PLANS[planKey];
  const amountNum = Number(amount);

  if (isNaN(amountNum) || amountNum < plan.min || amountNum > plan.max) {
    return res.status(400).json({
      message: `Amount must be $${plan.min.toLocaleString()} – $${plan.max.toLocaleString()}`
    });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const totalBalance = user.balance.checking + user.balance.savings + user.balance.usdt;
    if (totalBalance < amountNum) {
      return res.status(400).json({
        message: 'Insufficient balance',
        needsDeposit: true,
        required: amountNum - totalBalance
      });
    }

    // Deduct balance
    let remaining = amountNum;
    ['checking', 'savings', 'usdt'].forEach(acc => {
      if (remaining > 0 && user.balance[acc] >= remaining) {
        user.balance[acc] -= remaining;
        remaining = 0;
      } else if (remaining > 0) {
        remaining -= user.balance[acc];
        user.balance[acc] = 0;
      }
    });

    user.investments = user.investments || [];

    const minMonths = plan.term.includes('3') ? 3 : plan.term.includes('6') ? 6 : 12;
    const maxMonths = plan.term.includes('6') ? 6 : plan.term.includes('12') ? 12 : 24;
    const termMonths = Math.floor(Math.random() * (maxMonths - minMonths + 1)) + minMonths;
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + termMonths);

    const investment = {
      plan: planKey,
      amount: amountNum,
      rate: plan.rate,
      startDate: new Date(),
      maturityDate,
      status: 'Active',
      expectedReturn: amountNum * (1 + plan.rate),
      color: plan.color
    };

    user.investments.push(investment);

    // Transaction
    await new Transaction({
      userId: user._id,
      type: 'investment',
      amount: amountNum,
      method: 'balance',
      status: 'Completed',
      account: 'checking',
      date: new Date()
    }).save();

    // Notification
    user.notifications.push({
      message: `$${amountNum.toLocaleString()} invested in ${plan.name} Plan. Expected return: $${(amountNum * plan.rate).toFixed(2)}`,
      type: 'investment',
      date: new Date()
    });

    await user.save();

    res.json({
      message: 'Investment successful!',
      investment: user.investments[user.investments.length - 1],
      totalInvested: user.investments.reduce((s, i) => s + i.amount, 0),
      balance: user.balance
    });

  } catch (err) {
    console.error('Investment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === GET: My Investments ===
router.get('/my', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('investments');
    const investments = user?.investments || [];
    const total = investments.reduce((s, i) => s + i.amount, 0);
    res.json({ investments, totalInvested: total, count: investments.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;