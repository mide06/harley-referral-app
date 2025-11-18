const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Routers
const authRouter = require("./routes/auth.js"); // handles register & login
const formRouter = require("./routes/form.js"); // handles form submission + dashboard
const pagesRouter = require("./routes/pages.js"); // optional frontend/static pages

const app = express();

// 🌍 Environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ⚠️ Check MongoDB connection string
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found. Please check your .env file.");
  process.exit(1);
}

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
// Ensure preflight requests are handled globally
app.options('*', cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());

// Serve frontend static files (so /frontend/... URLs work)
const staticPath = path.join(__dirname, "frontend");
app.use(express.static(staticPath));
console.log("Serving static files from:", staticPath);

// 🔍 Debug: log every incoming request
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// ✅ API Routes
app.use("/api/auth", authRouter); // 🔑 registration, login, referrals
app.use("/api/form", formRouter); // 📝 referral form & dashboard
app.use("/", pagesRouter); // 🌐 optional static pages

// ✅ Default root route
app.get("/", (req, res) => {
  res.json({ message: "🎉 Welcome to the Referral System API" });
});

// 🔴 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
