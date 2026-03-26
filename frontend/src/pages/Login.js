import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    // fetch ไป backend
  };

  return (
  <div style={styles.container}>
    <div style={styles.card}>
      <h2 style={styles.title}>Login</h2>
      <p style={styles.subtitle}>Hello! let's get started</p>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={styles.input}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          style={styles.input}
        />

        <button style={styles.button}>Login</button>
      </form>

      <p style={styles.forgot}>Forgot password?</p>
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
    background: "#fff",
    padding: "30px",
    borderRadius: "15px",
    width: "320px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
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
    borderRadius: "10px",
    border: "1px solid #ddd",
    outline: "none",
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
  },

  forgot: {
    marginTop: "15px",
    fontSize: "12px",
    color: "#666",
  },
};