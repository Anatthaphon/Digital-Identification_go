import { useState } from "react";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login, register, otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [deviceId] = useState(navigator.userAgent);

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/auth/register", {
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
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deviceId }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      alert("Login successful!");
      localStorage.setItem("token", data.token);
    } else if (data.status === "otp_required") {
      alert("OTP required! Check console.");
      setMode("otp");
    } else {
      alert(data.message || "Login failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, deviceId }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      alert("OTP verified! Login successful!");
      localStorage.setItem("token", data.token);
      setMode("login"); // reset form
    } else {
      alert(data.message || "OTP failed");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      {mode === "login" && (
        <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
            <button type="submit" style={{ width: "100%", padding: "10px", marginTop: "8px", backgroundColor: "#4CAF50", color: "white", border: "none", cursor: "pointer" }}>Login</button>
          </form>
          <p>
            ไม่มีบัญชีใช่ไหม?{" "}
            <button onClick={() => setMode("register")} style={{ color: "#2196F3", border: "none", background: "none", cursor: "pointer" }}>Register</button>
          </p>
        </>
      )}

      {mode === "register" && (
        <>
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
            <button type="submit" style={{ width: "100%", padding: "10px", marginTop: "8px", backgroundColor: "#2196F3", color: "white", border: "none", cursor: "pointer" }}>Register</button>
          </form>
          <p>
            มีบัญชีแล้ว?{" "}
            <button onClick={() => setMode("login")} style={{ color: "#4CAF50", border: "none", background: "none", cursor: "pointer" }}>Login</button>
          </p>
        </>
      )}

      {mode === "otp" && (
        <>
          <h2>Enter OTP</h2>
          <form onSubmit={handleVerifyOtp}>
            <input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
            <button type="submit" style={{ width: "100%", padding: "10px", marginTop: "8px", backgroundColor: "#FF9800", color: "white", border: "none", cursor: "pointer" }}>Verify OTP</button>
          </form>
        </>
      )}
    </div>
  );
}