const bcrypt = require("bcrypt");

const calculateRisk = async (user, uuid, fingerprint, ip) => {
  let score = 0;

  const device = user.devices.find(d => d.uuid === uuid);

  // ❌ new device
  if (!device) score += 40;

  // ❌ fingerprint mismatch
  if (device && device.fingerprint) {
  try {
    const match = await bcrypt.compare(fingerprint, device.fingerprint);
    if (!match) score += 50;
  } catch (err) {
    score += 50;
  }
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

module.exports = calculateRisk;