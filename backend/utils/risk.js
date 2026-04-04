const bcrypt = require("bcrypt");

const calculateRisk = async (user, uuid, fingerprint, ip) => {
  let score = 0;

  const device = user.devices.find(d => d.uuid === uuid);

  // ❌ new device
  if (!device) {
    score += 40;
  }

  // ❌ fingerprint mismatch (SAFE VERSION)
  if (device && device.fingerprint && fingerprint) {
    try {
      const match = await bcrypt.compare(fingerprint, device.fingerprint);
      if (!match) score += 50;
    } catch (err) {
      console.log("Fingerprint compare error:", err.message);
      score += 50;
    }
  }

  // ❌ fingerprint ไม่มี (ถือว่าเสี่ยงนิดหน่อย)
  if (!fingerprint) {
    score += 20;
  }

  // ❌ IP changed (disable ชั่วคราวก่อน)
  // if (user.lastLoginIP && user.lastLoginIP !== ip) {
  //   score += 20;
  // }

  // ❌ brute force
  if (user.failedAttempts >= 3) {
    score += 40;
  }

  // 🎯 RESULT
  if (score >= 80) return "high";
  if (score >= 40) return "medium";
  return "low";
};

module.exports = calculateRisk;