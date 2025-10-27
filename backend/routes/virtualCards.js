// backend/routes/virtualCards.js
const express = require('express');
const router = express.Router();
const VirtualCard = require('../models/VirtualCard');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const cards = await VirtualCard.find({ userId: req.userId });
    res.json(cards);
  } catch (err) {
    console.error('Error fetching virtual cards:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const generateRandomNumber = (length) => {
      return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    };
    const cardNumber = generateRandomNumber(16);
    const cvv = generateRandomNumber(3);
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    const formattedExpiry = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;

    const card = new VirtualCard({
      userId: req.userId,
      cardNumber,
      cvv,
      expiryDate: formattedExpiry,
      cardType: 'Visa',
      status: 'Active',
    });
    await card.save();

    const user = await User.findById(req.userId);
    user.notifications.push({
      message: `New virtual card ending in ${cardNumber.slice(-4)} created`,
      date: new Date(),
    });
    await user.save();

    res.status(201).json(card);
  } catch (err) {
    console.error('Error creating virtual card:', err.message);
    res.status(500).json({ message: 'Failed to create virtual card' });
  }
});

router.delete('/:cardId', verifyToken, async (req, res) => {
  try {
    const card = await VirtualCard.findOne({ _id: req.params.cardId, userId: req.userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    await card.deleteOne();
    res.json({ message: 'Card deleted successfully' });
  } catch (err) {
    console.error('Error deleting virtual card:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;