require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// MongoDB
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// =====================
// Routes
// =====================
app.use("/api/auth", authRoutes);

// =====================
// ✅ หน้าเว็บ test (ใช้ใน iPhone ได้เลย)
// =====================
app.get("/", (req, res) => {
  res.send(`
    <h2>ADI Login Test</h2>
    <button onclick="login()">Login from iPhone</button>

    <script>
      async function login() {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: "siriphon.su@ku.th",
            password: "123456",
            deviceId: "iphone_" + Math.floor(Math.random()*1000)
          })
        });

        const data = await res.json();
        alert(JSON.stringify(data));
      }
    </script>
  `);
});

// =====================
// Server
// =====================
const PORT = 5000;
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running");
});