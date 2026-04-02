const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "SafeGuard Backend API 🚀" });
});

// API endpoints
app.get("/api/status", (req, res) => {
  res.json({ status: "active", timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`✅ SafeGuard Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
