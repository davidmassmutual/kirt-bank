// backend/scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define User schema
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

// Define Transaction schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  status: { type: String, default: 'Posted' },
  date: { type: Date, required: true },
  receipt: { type: String },
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function createAdmin() {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Drop username_1 index if it exists
    const indexes = await mongoose.connection.db.collection('users').indexes();
    const usernameIndex = indexes.find(index => index.name === 'username_1');
    if (usernameIndex) {
      console.log('Found username_1 index, dropping it...');
      await mongoose.connection.db.collection('users').dropIndex('username_1');
      console.log('Dropped username_1 index');
    }

    const email = 'sterlingtrustcontact@gmail.com';
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Admin user already exists:', email);
      // Check existing transactions
      const existingTransactions = await Transaction.find({ userId: existingUser._id });
      console.log('Existing transactions:', existingTransactions);
      if (existingTransactions.length === 0) {
        console.log('No transactions found, creating default transactions...');
        const transactions = [
          { date: new Date('2025-10-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
          { date: new Date('2025-09-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
          { date: new Date('2025-08-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
          { date: new Date('2025-07-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
          { date: new Date('2025-06-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
        ];
        for (const tx of transactions) {
          const transaction = new Transaction({
            userId: existingUser._id,
            type: tx.type,
            amount: tx.amount,
            method: tx.method,
            status: tx.status,
            date: tx.date,
          });
          await transaction.save();
          console.log('Created transaction:', tx);
        }
        console.log('Default transactions created for existing admin');
      }
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash('sterling123', 10);
    const admin = new User({
      name: 'Admin User',
      email: email,
      password: hashedPassword,
      isAdmin: true,
      phone: '',
      address: '',
      twoFactorEnabled: false,
      notifications: { email: true, sms: false, push: true },
      currency: 'USD',
      theme: 'light',
      savingsBalance: 115097000,
      checkingBalance: 508890,
      usdtBalance: 15000,
      createdAt: new Date(),
    });
    await admin.save();
    console.log('Admin user created:', email);

    // Create default transactions
    const transactions = [
      { date: new Date('2025-10-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-09-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-08-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-07-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
      { date: new Date('2025-06-10'), type: 'Payroll', method: 'Credit', amount: 2250, status: 'Posted' },
    ];

    for (const tx of transactions) {
      const transaction = new Transaction({
        userId: admin._id,
        type: tx.type,
        amount: tx.amount,
        method: tx.method,
        status: tx.status,
        date: tx.date,
      });
      await transaction.save();
      console.log('Created transaction:', tx);
    }
    console.log('Default transactions created for admin');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();