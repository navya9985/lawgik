const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: String },
  email: { type: String },
  phone: { type: String },
  role: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
