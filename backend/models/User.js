// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  notifications: [{
    message: String,
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }],
  notificationsSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  currency: { type: String, default: 'USD' },
  theme: { type: String, default: 'light' },
  isAdmin: { type: Boolean, default: false },
  balance: {
    checking: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 }
  },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: [] }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);