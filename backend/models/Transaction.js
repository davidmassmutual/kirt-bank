// backend/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., "Payroll"
  amount: { type: Number, required: true },
  method: { type: String, required: true }, // e.g., "Credit"
  status: { type: String, default: 'Posted' },
  date: { type: Date, required: true },
  receipt: { type: String },
});

module.exports = mongoose.model('Transaction', transactionSchema);