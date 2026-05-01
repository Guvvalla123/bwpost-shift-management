// server.js
// This is the main entry point of our backend.
// READ THIS FILE FIRST to understand the backend.
//
// This file does these things in order:
// 1. Loads environment variables from .env file
// 2. Imports all required packages
// 3. Connects to MongoDB database
// 4. Creates the Express application
// 5. Adds security and parsing middleware
// 6. Connects all route files
// 7. Adds the error handler
// 8. Starts the server on the PORT

// Load environment variables first
// This must be done before anything else
require("dotenv").config();

// Import the database connection function
const connectDB = require("./db");

// Import Express web framework
const express = require("express");

// Import security packages
// helmet adds security headers to every response
const helmet = require("helmet");

// cors allows our React frontend to make requests
// without cors the browser would block all requests
const cors = require("cors");

// cookie-parser lets us read cookies from requests
// this is how we read the JWT token
const cookieParser = require("cookie-parser");

// morgan logs every request in the console
// helpful for debugging in development
const morgan = require("morgan");

// Background auto checkout cron (runs every 10 minutes)
const { startAutoCheckoutJob } =
  require("./cron/autoCheckout");

// ── ROUTE FILES (uncomment as you add each file) ──

// Authentication: login, logout, profile
const authRoutes = require("./routes/authRoutes");
// Shift management routes — managers create and manage shifts
const shiftRoutes = require("./routes/shiftRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
// Attendance tracking — check in/out and breaks
const attendanceRoutes = require("./routes/attendanceRoutes");
const requestRoutes = require("./routes/requestRoutes");
// Invites: create and accept invite links
const inviteRoutes = require("./routes/inviteRoutes");
// Notifications: bell icon notifications
const notificationRoutes =
  require("./routes/notificationRoutes");
// Admin: user management and audit logs
const adminRoutes = require("./routes/adminRoutes");

// Import error handler middleware
const handleErrors = require("./middleware/handleErrors");

// Create the Express application
const app = express();

// Connect to MongoDB database
// We do this before starting the server
connectDB();

// ── SECURITY MIDDLEWARE ──────────────────────
// These run before every single request

// Add security headers to every response
app.use(helmet());

// Allow requests from our React frontend
// credentials: true is needed for cookies to work
app.use(
  cors({
    // Only allow requests from our frontend URL
    origin: process.env.ALLOWED_ORIGINS || "http://localhost:5173",
    // Allow cookies to be sent with requests
    credentials: true,
  })
);

// ── REQUEST PARSING ──────────────────────────
// These parse the request data before controllers

// Parse JSON request bodies
// limit 10kb prevents very large requests
app.use(express.json({ limit: "10kb" }));

// Parse cookies from request headers
// This lets us read the JWT token cookie
app.use(cookieParser());

// Log all requests in development mode
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ── ROUTES ───────────────────────────────────
// Each route file handles one feature of the app

app.use("/api/users", authRoutes);
app.use("/api/manager/shifts", shiftRoutes);
app.use("/api/employee/shifts", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/manager/requests", requestRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Cron: auto checkout forgetting employees after shift end
startAutoCheckoutJob();

// Health check endpoint
// Used by monitoring tools to check if server is up
app.get("/health", (req, res) => {
  // Send OK response with server status
  res.json({ status: "OK", message: "Server is running" });
});

// ── ERROR HANDLER ─────────────────────────────
// MUST be added after all routes
// Catches any error thrown in the route handlers
app.use(handleErrors);

// ── START SERVER ─────────────────────────────
// Get the port from .env or use 5500 as default
const PORT = process.env.PORT || 5500;

// Start listening for requests
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
