// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  currency: { type: String, default: 'USD' },
  theme: { type: String, default: 'light' },
  notificationsSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  balance: {
    checking: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },

  // Admin notifications
  adminNotifications: [{
    message: String,
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  }],
});

module.exports = mongoose.model('User', userSchema);