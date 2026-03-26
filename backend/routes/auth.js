require("dotenv").config(); 

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // ✅ เพิ่ม
const User = require("../models/User");

// =====================
// Mail Config
// =====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =====================
// Helper: JWT
// =====================
const createToken = (user) => {
  return jwt.sign({ id: user._id }, "your_jwt_secret", { expiresIn: "1h" });
};

// =====================
// Risk Score (ADI)
// =====================
const calculateRisk = (user, deviceId, ip) => {
  let score = 0;

  if (!user.devices.includes(deviceId)) score += 30;
  if (user.lastLoginIP && user.lastLoginIP !== ip) score += 30;
  if (user.failedAttempts >= 3) score += 40;

  if (score >= 70) return "high";
  if (score >= 30) return "medium";
  return "low";
};

// =====================
// REGISTER
// =====================
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================
// LOGIN
// =====================
router.post("/login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const ip = req.ip;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // 🔴 block check
    if (user.blockUntil && user.blockUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.blockUntil - new Date()) / 60000
      );

      return res.json({
        status: "blocked",
        message: `Account blocked. Try again in ${remainingTime} minute(s)`,
      });
    }

    // ✅ reset block
    if (user.blockUntil && user.blockUntil <= new Date()) {
      user.failedAttempts = 0;
      user.blockUntil = null;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // ❌ password ผิด
    if (!isMatch) {
      user.failedAttempts += 1;

      if (user.failedAttempts >= 3) {
        user.blockUntil = new Date(Date.now() + 10 * 60 * 1000);
      }

      await user.save();

      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // ✅ reset attempts
    user.failedAttempts = 0;

    const risk = calculateRisk(user, deviceId, ip);

    // 🟢 LOW
    if (risk === "low") {
      if (!user.devices.includes(deviceId)) {
        user.devices.push(deviceId);
      }

      user.lastLoginIP = ip;
      await user.save();

      const token = createToken(user);
      return res.json({ status: "ok", token });
    }

    // 🟡 MEDIUM → ส่ง OTP
    if (risk === "medium") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.otpSecret = otp;
      await user.save();

      // ✅ ส่งเมลจริง
      await transporter.sendMail({
        from: `"ADI Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}`,
      });

      return res.json({
        status: "otp_required",
        message: "OTP sent to your email",
      });
    }

    // 🔴 HIGH
    if (risk === "high") {
      user.blockUntil = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      return res.json({
        status: "blocked",
        message: "High risk detected. Login blocked for 10 minutes",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================
// VERIFY OTP
// =====================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, deviceId } = req.body;
    const ip = req.ip;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "User not found" });

    if (user.otpSecret === otp) {
      user.otpSecret = null;

      if (!user.devices.includes(deviceId)) {
        user.devices.push(deviceId);
      }

      user.lastLoginIP = ip;
      await user.save();

      const token = createToken(user);

      return res.json({
        status: "ok",
        token,
      });
    }

    return res.status(400).json({ message: "Invalid OTP" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;