// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

const app = express();

// Connect MongoDB
connectDB();

// Security headers (FIRST)
app.use(helmet());

// Logging
app.use(morgan("dev"));

// CORS (restricted)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Body & cookies
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});
app.use(limiter);

// Routes
const userRoutes = require("./routes/userRoutes");
const managerShiftRoutes = require("./routes/managerRoutes");
const employeeShiftRoutes = require("./routes/employeeRoutes");

app.use("/api/users", userRoutes);
app.use("/api/manager/shifts", managerShiftRoutes);
app.use("/api/employee/shifts", employeeShiftRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (NO LEAKS)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
