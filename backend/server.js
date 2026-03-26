const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./connectDB"); // << เรียกไฟล์ที่สร้าง

const app = express();

app.use(cors());
app.use(express.json());

// Connect database
connectDB();

// Routes
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));