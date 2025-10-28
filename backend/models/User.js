// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
  balance: {
    checking: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 },
  },
  transactions: [{
    type: String,           // deposit, withdrawal, transfer, loan
    amount: Number,
    method: String,         // e.g., bank, card, crypto
    status: { type: String, enum: ['Pending', 'Posted', 'Failed'], default: 'Pending' },
    date: { type: Date, default: Date.now },
  }],
  notifications: [{
    message: String,
    type: String,           // deposit, loan, alert, etc.
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);