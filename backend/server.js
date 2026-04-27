const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB
const pool = require("./src/config/db");

// Routes
const adminRoutes = require("./src/routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const studentRoutes = require("./src/routes/StudentRoutes");
app.use("/api/student", studentRoutes);

const teacherRoutes = require("./src/routes/teacherRoutes");
app.use("/api/teacher", teacherRoutes);

// Test DB route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Basic route
app.get("/", (req, res) => {
  res.send("Server running");
});

// Serve frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Server start 
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on LAN: http://localhost:5000");
});