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
  savingsBalance: { type: Number, default: 0 }, // $0
  checkingBalance: { type: Number, default: 0 }, // $0
  usdtBalance: { type: Number, default: 0 }, // $0
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

    const email = 'eunicewellis@gmail.com';
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Admin user already exists:', email);
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash('kirt123', 10);
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
      savingsBalance: 0,
      checkingBalance: 0,
      usdtBalance: 0,
      createdAt: new Date(),
    });
    await admin.save();
    console.log('Admin user created for Kirt Bank:', email);

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();