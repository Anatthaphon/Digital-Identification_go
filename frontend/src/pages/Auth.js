import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login, register, otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const getDeviceInfo = async () => {
  let uuid = localStorage.getItem("deviceId");

  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem("deviceId", uuid);
  }

  const fp = await FingerprintJS.load();
  const result = await fp.get();

  return {
    uuid,
    fingerprint: result.visitorId
  };
};

const validatePassword = (password) => {
  const minLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return {
    valid: minLength && hasUpper && hasLower && hasNumber && hasSymbol,
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
  };
};

  const handleRegister = async (e) => {
  e.preventDefault();

  const check = validatePassword(password);

  if (!check.valid) {
    alert("Password ต้องมีอย่างน้อย 12 ตัว + A-Z + a-z + 0-9 + สัญลักษณ์");
    return;
  }

  const res = await fetch("http://192.168.1.34:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.ok) {
    alert("Register successful! Please login.");
    setMode("login");
  } else {
    alert(data.message || "Register failed");
  }
};

  const handleLogin = async (e) => {
  e.preventDefault();

  const { uuid, fingerprint } = await getDeviceInfo();

  const res = await fetch("http://192.168.1.34:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      uuid,
      fingerprint
    }),
  });

  const data = await res.json();

  if (data.status === "ok") {
    alert("Login successful!");
    localStorage.setItem("token", data.token);
  } else if (data.status === "otp_required") {
    alert("OTP required!");
    setMode("otp");
  } else {
    alert(data.message || "Login failed");
  }
};

  const handleVerifyOtp = async (e) => {
  e.preventDefault();

  const { uuid, fingerprint } = await getDeviceInfo();

  const res = await fetch("http://192.168.1.34:5000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      otp,
      uuid,
      fingerprint
    }),
  });

  const data = await res.json();

  if (data.status === "ok") {
    alert("OTP verified! Login successful!");
    localStorage.setItem("token", data.token);
    setMode("login");
  } else {
    alert(data.message || "OTP failed");
  }
};

const check = validatePassword(password);

  return (
  <div style={styles.container}>
    <div style={styles.card}>
      
      {/* LOGIN */}
      {mode === "login" && (
        <>
          <h2 style={styles.title}>Login</h2>
          <p style={styles.subtitle}>Hello! let's get started</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />

            <button style={styles.button}>Login</button>
          </form>

          <p style={styles.linkText}>
            ไม่มีบัญชีใช่ไหม?{" "}
            <span style={styles.link} onClick={() => setMode("register")}>
              Register
            </span>
          </p>
        </>
      )}

      {/* REGISTER */}
      {mode === "register" && (
  <>
    <h2>Register</h2>
    <form onSubmit={handleRegister}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={styles.input}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={styles.input}
      />

      {/* 👇 ใส่ตรงนี้เลย */}
      <ul style={{ textAlign: "left", fontSize: "12px", marginTop: "10px" }}>
        <li style={{ color: check.minLength ? "green" : "red" }}>
          ✔ อย่างน้อย 12 ตัว
        </li>
        <li style={{ color: check.hasUpper ? "green" : "red" }}>
          ✔ มีตัวพิมพ์ใหญ่
        </li>
        <li style={{ color: check.hasLower ? "green" : "red" }}>
          ✔ มีตัวพิมพ์เล็ก
        </li>
        <li style={{ color: check.hasNumber ? "green" : "red" }}>
          ✔ มีตัวเลข
        </li>
        <li style={{ color: check.hasSymbol ? "green" : "red" }}>
          ✔ มีสัญลักษณ์
        </li>
      </ul>

      <button style={styles.button}>Register</button>
    </form>

          <p style={styles.linkText}>
            มีบัญชีแล้ว?{" "}
            <span style={styles.link} onClick={() => setMode("login")}>
              Login
            </span>
          </p>
        </>
      )}

      {/* OTP */}
      {mode === "otp" && (
        <>
          <h2 style={styles.title}>Verify OTP</h2>
          <p style={styles.subtitle}>Check your email</p>

          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={styles.input}
            />

            <button style={styles.button}>Verify</button>
          </form>
        </>
      )}
    </div>
  </div>
);
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #6a11cb, #2575fc)",
    fontFamily: "Arial",
  },

  card: {
  background: "rgba(255,255,255,0.9)",
  padding: "35px",
  borderRadius: "20px",
  width: "340px",
  textAlign: "center",
  animation: "fadeIn 0.5s ease",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  backdropFilter: "blur(10px)",
},

  title: {
    marginBottom: "5px",
  },

  subtitle: {
    fontSize: "12px",
    color: "#888",
    marginBottom: "20px",
  },

  input: {
  width: "100%",
  padding: "12px",
  margin: "10px 0",
  borderRadius: "12px",
  border: "1px solid #ddd",
  outline: "none",
  background: "#f5f5f5",
  transition: "0.2s",
  textAlign: "left",
},

  button: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "25px",
    border: "none",
    background: "linear-gradient(90deg, #6a11cb, #2575fc)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
    marginTop: "10px",
  },

  linkText: {
    marginTop: "15px",
    fontSize: "12px",
    color: "#666",
  },

  link: {
    color: "#2575fc",
    cursor: "pointer",
    fontWeight: "bold",
  },
};