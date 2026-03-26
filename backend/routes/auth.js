require("dotenv").config();

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");

// ================= MAIL =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= JWT =================
const createToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// ================= RISK =================
const calculateRisk = async (user, uuid, fingerprint, ip) => {
  let score = 0;

  const device = user.devices.find(d => d.uuid === uuid);

  // ❌ new device
  if (!device) score += 40;

  // ❌ fingerprint mismatch
  if (device && device.fingerprint) {
    const match = await bcrypt.compare(fingerprint, device.fingerprint);
    if (!match) score += 50;
  }

  // ❌ IP changed
  if (user.lastLoginIP && user.lastLoginIP !== ip) {
    score += 20;
  }

  // ❌ brute force
  if (user.failedAttempts >= 3) {
    score += 40;
  }

  if (score >= 80) return "high";
  if (score >= 40) return "medium";
  return "low";
};

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password, uuid, fingerprint } = req.body;
    const ip = req.ip;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🔴 BLOCK CHECK
    if (user.blockUntil && user.blockUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.blockUntil - new Date()) / 60000
      );

      return res.json({
        status: "blocked",
        message: `Account blocked. Try again in ${remainingTime} minutes`,
      });
    }

    // reset block
    if (user.blockUntil && user.blockUntil <= new Date()) {
      user.failedAttempts = 0;
      user.blockUntil = null;
    }

    // 🔐 PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password);

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

    // reset attempts
    user.failedAttempts = 0;

    // 🧠 RISK CHECK
    const risk = await calculateRisk(user, uuid, fingerprint, ip);

    // 🟢 LOW
    if (risk === "low") {
      await handleDevice(user, uuid, fingerprint, ip);

      const token = createToken(user);

      return res.json({
        status: "ok",
        token,
      });
    }

    // 🟡 MEDIUM → OTP
    if (risk === "medium") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.otpCode = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      await user.save(); // 🔥 ห้ามลืมบรรทัดนี้เด็ดขาด

      console.log("OTP saved:", otp);

      await transporter.sendMail({
        to: email,
        subject: "OTP Code",
        text: `Your OTP is: ${otp}`,
      });

      return res.json({
        status: "otp_required",
      });
    }

    // 🔴 HIGH → BLOCK
    user.blockUntil = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return res.json({
      status: "blocked",
      message: "High risk detected. Login blocked for 10 minutes",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, uuid, fingerprint } = req.body;
    const ip = req.ip;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // ❌ OTP invalid
    if (
      String(user.otpCode) !== String(otp) ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // reset OTP
    user.otpCode = null;
    user.otpExpires = null;

    await handleDevice(user, uuid, fingerprint, ip);

    const token = createToken(user);

    return res.json({
      status: "ok",
      token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DEVICE HANDLER =================
const handleDevice = async (user, uuid, fingerprint, ip) => {
  let device = user.devices.find(d => d.uuid === uuid);

  if (!device) {
    const hashedFp = await bcrypt.hash(fingerprint, 5);

    user.devices.push({
      uuid,
      fingerprint: hashedFp,
      lastUsed: new Date(),
    });
  } else {
    device.lastUsed = new Date();
  }

  user.lastLoginIP = ip;

  await user.save();
};

module.exports = router;