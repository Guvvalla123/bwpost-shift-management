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

dotenv.config();

const app = express();

// Connect MongoDB
connectDB();

/* ================= SECURITY ================= */

// Security headers
app.use(helmet());

// Logging
app.use(morgan("dev"));

/* ================= CORS ================= */

const allowedOrigins = [
  "https://bwpost-shift-management.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {

    // Allow Postman / curl / server requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}));

// Handle preflight requests
app.options("*", cors());

/* ================= BODY ================= */

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

/* ================= SECURITY PROTECTION ================= */

app.use(mongoSanitize());
app.use(xss());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});
app.use(limiter);

/* ================= ROUTES ================= */

const userRoutes = require("./routes/userRoutes");
const managerShiftRoutes = require("./routes/managerRoutes");
const employeeShiftRoutes = require("./routes/employeeRoutes");
const requestRoutes = require("./routes/requestRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

app.use("/api/users", userRoutes);
app.use("/api/manager/shifts", managerShiftRoutes);
app.use("/api/employee/shifts", employeeShiftRoutes);
app.use("/api/manager/requests", requestRoutes);
app.use("/api/attendance", attendanceRoutes);

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.status(200).send("Backend is running");
});

/* ================= 404 ================= */

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ================= GLOBAL ERROR ================= */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});