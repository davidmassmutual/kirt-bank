// backend/models/VirtualCard.js
const mongoose = require('mongoose');

const virtualCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cardNumber: { type: String, required: true },
  cvv: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cardType: { type: String, default: 'Visa' },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VirtualCard', virtualCardSchema);