// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const xss = require("xss");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const { startCronJobs } = require("./services/cronService");
const AppError = require("./utils/AppError");

dotenv.config();

/* ================= ENV VALIDATION ================= */
const required = ["MONGO_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing required env vars:", missing.join(", "));
  process.exit(1);
}

const app = express();

// Trust Render's reverse proxy
app.set("trust proxy", 1);

// Connect MongoDB
connectDB();

function initCronAfterDb() {
  try {
    startCronJobs();
  } catch (err) {
    console.error("Failed to start cron jobs:", err.message);
  }
}

mongoose.connection.once("connected", initCronAfterDb);
if (mongoose.connection.readyState === 1) {
  initCronAfterDb();
}

/* ================= SECURITY ================= */

// Security headers
app.use(helmet());

// Request ID for tracing
const { randomUUID } = require("crypto");
app.use((req, res, next) => {
  req.id = req.get("x-request-id") || randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
});

// Logging (use short format in production to avoid noisy output)
app.use(morgan(process.env.NODE_ENV === "production" ? "short" : "dev"));

/* ================= CORS ================= */

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : [
      "https://bwpost-shift-management.vercel.app",
      "http://localhost:5173",
    ];

app.use(cors({
  origin: function (origin, callback) {
    // In production, block requests with no Origin header (Postman/curl)
    // In development, allow them for easier testing
    if (!origin) {
      const isProd = process.env.NODE_ENV === "production";
      return callback(null, !isProd);
    }

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

/* ================= CSRF PROTECTION ================= */
const csrfProtect = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next();
  if (!allowedOrigins.includes(origin)) {
    return next(new AppError("Forbidden: origin not allowed", 403));
  }
  next();
};
app.use(csrfProtect);

/* ================= BODY ================= */

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

/* ================= SECURITY PROTECTION ================= */

app.use(mongoSanitize());

// XSS sanitization — replaces unmaintained xss-clean
app.use((req, res, next) => {
  if (req.body) {
    req.body = JSON.parse(xss(JSON.stringify(req.body)));
  }
  if (req.query) {
    req.query = JSON.parse(xss(JSON.stringify(req.query)));
  }
  if (req.params) {
    req.params = JSON.parse(xss(JSON.stringify(req.params)));
  }
  next();
});

// Global rate limiter (production only — dev has hot-reload + StrictMode double-mounts)
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      next(new AppError("Too many requests, try again later", options.statusCode));
    },
  });
  app.use(limiter);
}

/* ================= ROUTES ================= */

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const managerShiftRoutes = require("./routes/managerRoutes");
const employeeShiftRoutes = require("./routes/employeeRoutes");
const requestRoutes = require("./routes/requestRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const inviteRoutes = require("./routes/inviteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/users", userRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager/shifts", managerShiftRoutes);
app.use("/api/employee/shifts", employeeShiftRoutes);
app.use("/api/manager/requests", requestRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

app.get("/health", (req, res) => {
  // Only same-server checks or a secret header: see HEALTH_CHECK_SECRET
  const healthToken = process.env.HEALTH_CHECK_SECRET;
  if (healthToken) {
    const provided = req.headers["x-health-token"];
    if (provided !== healthToken) {
      return res.status(401).json({ status: "unauthorized" });
    }
  }
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const dbString = dbStatus[dbState] || "unknown";
  const uptime = Math.round(process.uptime() * 100) / 100;
  const timestamp = new Date().toISOString();
  if (dbState === 1) {
    return res.status(200).json({
      status: "ok",
      timestamp,
      db: "connected",
      uptime,
    });
  }
  return res.status(503).json({
    status: "degraded",
    timestamp,
    db: dbString,
    uptime,
  });
});

/* ================= 404 ================= */

app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

/* ================= GLOBAL ERROR ================= */

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5500;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ================= GRACEFUL SHUTDOWN ================= */

const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed. Process exiting.");
    process.exit(0);
  });
  setTimeout(() => { process.exit(1); }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));