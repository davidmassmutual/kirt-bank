// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  currency: { type: String, default: 'USD' },
  theme: { type: String, default: 'light' },
  isAdmin: { type: Boolean, default: false },
  savingsBalance: { type: Number, default: 115097000 }, // $115,097,000
  checkingBalance: { type: Number, default: 508890 }, // $508,890
  usdtBalance: { type: Number, default: 15000 }, // $15,000
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);