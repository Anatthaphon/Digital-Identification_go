const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  uuid: String,
  fingerprint: String,
  lastUsed: Date
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  devices: [deviceSchema],

  lastLoginIP: String,

  failedAttempts: { type: Number, default: 0 },
  blockUntil: Date,

  otpCode: String,
  otpExpires: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);