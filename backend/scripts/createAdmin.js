// scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash('kirt@123', 10);
  const admin = {
    name: 'Admin',
    email: 'samirahpartel48@gmail.com',
    password: hash,
    isAdmin: true,
    balance: { checking: 0, savings: 0, usdt: 0 },
    transactions: [],
    notifications: []
  };
  await mongoose.connection.db.collection('users').insertOne(admin);
  console.log('Admin created');
  process.exit();
});