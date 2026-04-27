// server.js
// This is the main entry point for the backend.
// It creates the Express app, applies all middleware,
// registers all routes, and starts the server.
//
// READ THIS FILE TOP TO BOTTOM TO UNDERSTAND THE APP.
//
// HOW THE SERVER STARTS:
// 1. Load all packages and files (imports)
// 2. Validate required environment variables
// 3. Create the Express app
// 4. Apply security middleware
// 5. Apply CORS so frontend can talk to backend
// 6. Apply CSRF protection
// 7. Parse request bodies (JSON, cookies)
// 8. Sanitize request data (NoSQL injection, XSS)
// 9. Apply rate limiting (production only)
// 10. Register all API routes
// 11. Register error handling middleware
// 12. Start the server and listen on the port
// 13. Start cron jobs after database connects

// ─────────────────────────────────────────────────────
// SECTION 1 — IMPORTS
// Load all required packages and local files
// ─────────────────────────────────────────────────────

// Express — the web framework we use to create our API
const express = require("express");

// dotenv — reads the .env file and loads its values
// into process.env so we can access them with process.env.VARIABLE_NAME 
const dotenv = require("dotenv");
dotenv.config();

// cors — allows our React frontend to make requests
// to this backend server from a different domain.
// Without this, browsers block cross-origin requests.
const cors = require("cors");

// helmet — automatically adds security headers to every
// HTTP response. Protects against common attacks like
// XSS, clickjacking, MIME sniffing, and others.
const helmet = require("helmet");

// express-mongo-sanitize — strips characters that could
// be used for MongoDB injection attacks from request data.
// Example: prevents { "$gt": "" } in request body.
const mongoSanitize = require("express-mongo-sanitize");

// express-rate-limit — limits how many requests a single
// IP can make in a time window. Prevents brute force attacks.
const rateLimit = require("express-rate-limit");

// xss — sanitizes strings by escaping HTML special characters.
// Prevents Cross-Site Scripting (XSS) attacks from user input.
const xss = require("xss");

// morgan — logs every incoming request to the console.
// Shows the method, URL, status code, and response time.
// Very helpful for debugging during development.
const morgan = require("morgan");

// cookie-parser — parses the Cookie header from requests
// and exposes cookies as req.cookies.
// This is how we read the JWT token stored in cookies.
const cookieParser = require("cookie-parser");

// crypto — built-in Node.js module.
// We use randomUUID() to generate a unique ID for every request.
const { randomUUID } = require("crypto");

// mongoose — the MongoDB ODM. We import it here to check
// the database connection state in the health check route
// and to close it cleanly on shutdown.
const mongoose = require("mongoose");

// connectDB — our custom function that connects to MongoDB.
// Defined in config/db.js. Handles retry logic.
const connectDB = require("./config/db");

// startAllCronJobs — starts all scheduled background tasks.
// Defined in cron/cronJobs.js. Called after database connects.
const { startAllCronJobs } = require("./cron/cronJobs");

// AppError — our custom error class.
// Used to create errors with a status code and message.
// Controllers throw this and errorMiddleware catches it.
const AppError = require("./helpers/AppError");

// logEvent — writes security-related events to a log file.
// Used to track rate limit hits, auth failures, and CSP violations.
const { logEvent } = require("./helpers/securityLog");

// Route files — each file handles one feature area.
// Every route file registers multiple API endpoints.
const authRoutes         = require("./routes/authRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const shiftRoutes        = require("./routes/shiftRoutes");
const employeeRoutes     = require("./routes/employeeRoutes");
const requestRoutes      = require("./routes/requestRoutes");
const attendanceRoutes   = require("./routes/attendanceRoutes");
const inviteRoutes       = require("./routes/inviteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// errorMiddleware — the global error handler.
// Must be registered AFTER all routes.
// Catches any error thrown by controllers and sends
// a proper JSON error response to the frontend.
const errorMiddleware = require("./middleware/errorMiddleware");

// ─────────────────────────────────────────────────────
// SECTION 2 — ENVIRONMENT VARIABLE VALIDATION
// Check that required secrets and config values exist.
// If anything is missing the server refuses to start.
// ─────────────────────────────────────────────────────

// List of environment variables that MUST be set in .env
// If any are missing, log which ones are missing and exit immediately.
// This prevents the server from running in a broken state.
const required = ["MONGO_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET", "FRONTEND_URL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error("Missing required env vars:", missing.join(", "));
  process.exit(1);
}

// ─────────────────────────────────────────────────────
// SECTION 3 — CREATE EXPRESS APP
// ─────────────────────────────────────────────────────

// Create the Express application object.
// All middleware and routes are attached to this object.
const app = express();

// Remove the "X-Powered-By: Express" header from responses.
// This hides the fact that we use Express from attackers.
app.disable("x-powered-by");

// Tell Express to trust the first reverse proxy in front of it.
// Render.com (our hosting provider) sits in front of the server.
// Without this, req.ip would show the proxy IP instead of the user IP.
// This is needed for rate limiting to work correctly per user.
app.set("trust proxy", 1);

// ─────────────────────────────────────────────────────
// SECTION 4 — DATABASE CONNECTION AND CRON JOBS
// Connect to MongoDB. Start cron jobs after it connects.
// ─────────────────────────────────────────────────────

// Initiate the database connection.
// This runs asynchronously — the server starts even before
// the database connects. The cron jobs wait until connected.
connectDB();

// startCronJobsWhenReady — safely starts all cron jobs.
// Wrapped in try/catch so a cron failure does not crash the server.
function startCronJobsWhenReady() {
  try {
    // Start all scheduled background jobs after database is ready.
    // For example: the auto-checkout job runs every 10 minutes.
    startAllCronJobs();
  } catch (err) {
    console.error("Failed to start cron jobs:", err.message);
  }
}

// Wait for the database to connect, then start cron jobs.
// "connected" fires once when Mongoose establishes a connection.
mongoose.connection.once("connected", startCronJobsWhenReady);

// Handle the edge case where Mongoose already connected
// before this listener was registered (e.g., in hot-reload scenarios).
if (mongoose.connection.readyState === 1) {
  startCronJobsWhenReady();
}

// ─────────────────────────────────────────────────────
// SECTION 5 — SECURITY HEADERS (HELMET)
// Helmet adds HTTP security headers to every response.
// These headers tell the browser how to behave safely.
// ─────────────────────────────────────────────────────

// isProd — true when running on the production server (Render).
// Some security settings are stricter in production.
const isProd = process.env.NODE_ENV === "production";

// feUrl — the clean frontend URL without trailing slash.
// Used in Content Security Policy to allow frontend requests.
const feUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

// buildConnectSrc — builds the list of URLs that the browser
// is allowed to connect to (for fetch/XHR requests).
// This is part of the Content Security Policy (CSP).
function buildConnectSrc() {
  const allowed = new Set(["'self'"]);

  // Allow the frontend URL to connect
  if (feUrl) allowed.add(feUrl);

  // Allow any additional origins listed in ALLOWED_ORIGINS env var
  (process.env.ALLOWED_ORIGINS || "").split(",").forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed) allowed.add(trimmed);
  });

  // Allow Cloudinary for profile image uploads and serving
  allowed.add("https://res.cloudinary.com");
  allowed.add("https://api.cloudinary.com");

  return Array.from(allowed);
}

// cspReportUri — the URL where the browser sends CSP violation reports.
// If set in .env, use that URL. Otherwise default to our own endpoint.
const cspReportUri = process.env.API_CSP_REPORT_URI
  ? [String(process.env.API_CSP_REPORT_URI).trim()]
  : ["/api/csp-report"];

// cspDirectives — the rules for the Content Security Policy header.
// This tells the browser what types of content it is allowed to load.
// Our API only sends JSON — no scripts, styles, or forms are needed.
const cspDirectives = {
  // Block all content types by default unless explicitly allowed
  defaultSrc: ["'none'"],
  // No scripts allowed from the API response (it only returns JSON)
  scriptSrc: ["'none'"],
  // No styles allowed from the API response
  styleSrc: ["'none'"],
  // Only allow images from same origin and inline data URIs
  imgSrc: ["'self'", "data:"],
  // Allow fetches only to these trusted origins
  connectSrc: buildConnectSrc(),
  // Prevent form submissions to any external URL
  formAction: ["'none'"],
};

// In production, add the report URI so browsers send violation reports
if (isProd) {
  cspDirectives.reportUri = cspReportUri;
}

// Apply Helmet with all security options configured
app.use(
  helmet({
    // Content Security Policy — controls what the browser can load
    contentSecurityPolicy: {
      useDefaults: false,
      directives: cspDirectives,
    },

    // HSTS — force HTTPS for 1 year in production.
    // Disabled in development so localhost HTTP works normally.
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,

    // Prevent the page from being loaded in an iframe (stops clickjacking)
    frameguard: { action: "deny" },

    // Control how much referrer info is sent with requests
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },

    // Allow cross-origin resource sharing for Cloudinary images
    crossOriginResourcePolicy: { policy: "cross-origin" },

    // Prevent the page from being opened in a cross-origin popup
    crossOriginOpenerPolicy: { policy: "same-origin" },

    // Disable COEP — would block Cloudinary image embeds if enabled
    crossOriginEmbedderPolicy: false,
  })
);

// Permissions-Policy header — disable browser features we do not use.
// This prevents a compromised page from accessing camera, mic, GPS, etc.
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()"
  );
  next();
});

// Request ID middleware — assigns a unique ID to every incoming request.
// This ID is attached to log lines so we can trace a request
// through all the log output if something goes wrong.
app.use((req, res, next) => {
  // Use the request ID from the client if provided, or generate a new one
  req.id = req.get("x-request-id") || randomUUID();

  // Echo the request ID back in the response header
  res.setHeader("X-Request-ID", req.id);

  // Prevent the browser from guessing the content type of a response
  res.setHeader("X-Content-Type-Options", "nosniff");

  next();
});

// Request logging middleware using Morgan.
// In production: logs the request ID, IP, method, URL, status and time.
// In development: simpler format without IP for easier reading.
morgan.token("req-id", (req) => req.id || "-");
app.use(
  morgan(
    isProd
      ? ":req-id :remote-addr :method :url :status :res[content-length] - :response-time ms"
      : ":req-id :method :url :status :response-time ms"
  )
);

// Auth failure logging — automatically logs every 401 and 403 response.
// These are written to the security log for monitoring and alerting.
app.use((req, res, next) => {
  res.on("finish", () => {
    const code = res.statusCode;
    // Log unauthorized (401) and forbidden (403) responses
    if (code === 401 || code === 403) {
      logEvent(`http_${code}`, req, { status: code });
    }
  });
  next();
});

// ─────────────────────────────────────────────────────
// SECTION 6 — CORS CONFIGURATION
// CORS (Cross-Origin Resource Sharing) controls which
// websites are allowed to make requests to our API.
// Without CORS the browser blocks all frontend requests.
// ─────────────────────────────────────────────────────

// buildAllowedOrigins — builds the list of allowed frontend URLs.
// Reads from ALLOWED_ORIGINS env var (comma-separated list).
// Falls back to FRONTEND_URL if ALLOWED_ORIGINS is not set.
function buildAllowedOrigins() {
  if (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.trim()) {
    return process.env.ALLOWED_ORIGINS
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) {
    return [process.env.FRONTEND_URL.replace(/\/$/, "")];
  }
  return [];
}

const allowedOrigins = buildAllowedOrigins();

// Apply CORS middleware — checks every request's Origin header
// and decides whether to allow or block it.
app.use(cors({
  // origin function — called for every request that has an Origin header.
  // Returns true to allow, false to block.
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., Postman, curl, same-origin)
    // In production these are blocked; in development they are allowed.
    if (!origin) {
      return callback(null, !isProd);
    }

    // Allow the request if its origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Block all other origins
    return callback(null, false);
  },

  // Allow cookies and authorization headers in cross-origin requests.
  // Required so the browser sends our JWT token cookies with every request.
  credentials: true,

  // List of HTTP methods the frontend is allowed to use
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  // List of headers the frontend is allowed to send
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Request-ID",
    "X-Requested-With",
    "If-None-Match",
  ],

  // Headers the frontend JavaScript is allowed to read from the response
  exposedHeaders: ["X-Request-ID"],

  // Cache the preflight response for 24 hours
  // This reduces the number of OPTIONS preflight requests
  maxAge: 86400,
}));

// Respond to OPTIONS preflight requests from the browser.
// The browser sends OPTIONS before POST/PUT/DELETE to check CORS rules.
app.options("*", cors());

// ─────────────────────────────────────────────────────
// SECTION 7 — CSRF PROTECTION
// CSRF (Cross-Site Request Forgery) is when a malicious
// website tricks a logged-in user into making an unwanted
// request to our API using their saved cookies.
//
// HOW OUR PROTECTION WORKS:
// We check the Origin header on all state-changing requests.
// If the request comes from an unknown origin we block it.
// GET/HEAD/OPTIONS requests are safe so we skip those.
// ─────────────────────────────────────────────────────

// csrfProtect — middleware that validates the request Origin.
// Only state-changing methods (POST, PUT, DELETE, PATCH) are checked.
const csrfProtect = (req, res, next) => {
  // Safe methods cannot change state, so skip the check
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.get("origin");

  // Requests with no Origin header (e.g., from server-to-server or curl)
  // are allowed through — they cannot carry browser cookies
  if (!origin) return next();

  // Block requests from unknown origins on state-changing methods
  if (!allowedOrigins.includes(origin)) {
    return next(new AppError("Forbidden: origin not allowed", 403));
  }

  next();
};

app.use(csrfProtect);

// ─────────────────────────────────────────────────────
// SECTION 8 — REQUEST PARSING AND SANITIZATION
// Parse incoming request data and clean it for safety.
// All requests go through these steps before reaching
// any controller function.
// ─────────────────────────────────────────────────────

// Parse JSON request bodies.
// limit: "10kb" — reject requests larger than 10 kilobytes.
// This prevents large payload denial-of-service attacks.
app.use(express.json({ limit: "10kb" }));

// Parse cookies from the Cookie request header.
// After this runs, cookies are available as req.cookies.
// This is how we read the JWT access token and refresh token.
app.use(cookieParser());

// CSP violation report endpoint.
// When the browser detects a CSP violation it sends a POST here.
// We log it and return 204 No Content (no body needed).
app.post("/api/csp-report", express.json({ limit: "32kb" }), (req, res) => {
  try {
    logEvent("csp_report", req, {
      body: typeof req.body === "object" ? req.body : {},
    });
  } catch (err) {
    logEvent("csp_report_parse", req, { error: err.message });
  }
  res.status(204).end();
});

// Disable caching for all API responses.
// Prevents browsers and proxies from caching sensitive data
// like user profiles, shift data, or tokens.
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// MongoDB injection protection — removes special characters
// like "$" and "." from request body, query, and params.
// Prevents attackers from injecting MongoDB operators like { $gt: "" }.
app.use(mongoSanitize());

// XSS sanitization — escapes HTML special characters in all request data.
// Prevents attackers from injecting scripts via input fields.
// For example: <script>alert(1)</script> becomes &lt;script&gt;...
app.use((req, res, next) => {
  // Sanitize the request body (POST and PUT data)
  if (req.body) {
    req.body = JSON.parse(xss(JSON.stringify(req.body)));
  }

  // Sanitize query string parameters (?search=value)
  if (req.query) {
    req.query = JSON.parse(xss(JSON.stringify(req.query)));
  }

  // Sanitize URL parameters (:id, :shiftId, etc.)
  if (req.params) {
    req.params = JSON.parse(xss(JSON.stringify(req.params)));
  }

  next();
});

// Global rate limiter — only active in production.
// Limits each IP address to 100 requests per 15 minutes.
// Skipped in development to avoid blocking hot-reload and React StrictMode.
if (process.env.NODE_ENV === "production") {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      // Log the rate limit event to the security log
      logEvent("rate_limit", req, { limit: 100, window: "15m" });
      next(new AppError("Too many requests, try again later", options.statusCode));
    },
  });

  app.use(globalLimiter);
}

// ─────────────────────────────────────────────────────
// SECTION 9 — ROUTES
// Each route file handles one feature of the application.
// Requests are matched by their URL prefix and sent to
// the correct route file.
//
// HOW ROUTES WORK:
// 1. Request comes in with a URL like POST /api/users/login
// 2. Express matches the /api/users prefix to authRoutes
// 3. authRoutes matches /login to the login controller function
// 4. login controller runs the business logic and sends response
// ─────────────────────────────────────────────────────

// Health check route — used by UptimeRobot to check if server is running.
// Returns 200 OK when database is connected.
// Returns 503 Service Unavailable when database is disconnected.
// Supports an optional secret header to prevent unauthorized access.
app.get("/health", (req, res) => {
  // If HEALTH_CHECK_SECRET is set in .env, require it in the request header
  const healthToken = process.env.HEALTH_CHECK_SECRET;
  if (healthToken) {
    const provided = req.headers["x-health-token"];
    if (provided !== healthToken) {
      return res.status(401).json({ status: "unauthorized" });
    }
  }

  // Map Mongoose connection states to readable strings
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbState = mongoose.connection.readyState;
  const dbString = dbStateMap[dbState] || "unknown";
  const uptime = Math.round(process.uptime() * 100) / 100;
  const timestamp = new Date().toISOString();

  // Return 200 if database is connected, 503 if not
  if (dbState === 1) {
    return res.status(200).json({ status: "ok", timestamp, db: "connected", uptime });
  }
  return res.status(503).json({ status: "degraded", timestamp, db: dbString, uptime });
});

// Root route — quick check that the backend is running at all
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

// Authentication routes
// POST /api/users/login          — user logs in
// POST /api/users/logout         — user logs out
// POST /api/users/register       — user registers via invite
// POST /api/users/refresh-token  — renews access token
// POST /api/users/forgot-password — request password reset link
// POST /api/users/reset-password  — submit new password
// GET  /api/users/me             — get logged in user profile
// PUT  /api/users/profile        — update profile
app.use("/api/users", authRoutes);

// Invite routes
// GET  /api/invites/validate/:token — check if invite link is valid
// POST /api/invites/accept          — register using invite link
// GET  /api/invites                 — list all invites (manager/admin)
// POST /api/invites                 — create new invite link (manager/admin)
app.use("/api/invites", inviteRoutes);

// Admin routes
// GET  /api/admin/users              — list all users in system
// POST /api/admin/users              — create user directly
// PUT  /api/admin/users/:id/role     — change user role
// POST /api/admin/users/:id/reset-password-link — generate reset link
// GET  /api/admin/audit-logs         — view audit trail
app.use("/api/admin", adminRoutes);

// Shift management routes (manager and admin only)
// GET    /api/manager/shifts          — list all shifts
// POST   /api/manager/shifts          — create a shift
// GET    /api/manager/shifts/:id      — get one shift
// PUT    /api/manager/shifts/:id      — update a shift
// DELETE /api/manager/shifts/:id      — delete a shift
// GET    /api/manager/shifts/dashboard/data — dashboard stats
// GET    /api/manager/shifts/export/csv     — export CSV
// + employee management and shift assignment routes
app.use("/api/manager/shifts", shiftRoutes);

// Employee shift routes (employee only)
// GET  /api/employee/shifts/available-shifts      — browse open shifts
// GET  /api/employee/shifts/myshifts              — my work schedule
// POST /api/employee/shifts/applyForShift         — apply for a shift
// POST /api/employee/shifts/cancelShift           — cancel application
// POST /api/employee/shifts/requests/leave        — submit leave request
// POST /api/employee/shifts/requests/shift-change — request shift change
// GET  /api/employee/shifts/requests              — view my requests
app.use("/api/employee/shifts", employeeRoutes);

// Manager request routes (manager and admin only)
// GET /api/manager/requests            — list all requests
// PUT /api/manager/requests/:id/approve — approve a request
// PUT /api/manager/requests/:id/reject  — reject a request
app.use("/api/manager/requests", requestRoutes);

// Attendance routes
// POST /api/attendance/checkin       — check in to shift
// POST /api/attendance/checkout      — check out of shift
// POST /api/attendance/break/start   — start a break
// POST /api/attendance/break/end     — end a break
// GET  /api/attendance/my/:shiftId   — view own attendance
// GET  /api/attendance/weekly-hours  — view weekly hours
// GET  /api/attendance/shift/:id     — view shift attendance (manager)
app.use("/api/attendance", attendanceRoutes);

// Notification routes
// GET /api/notifications             — get all notifications
// PUT /api/notifications/read-all    — mark all as read
// PUT /api/notifications/:id/read    — mark one as read
app.use("/api/notifications", notificationRoutes);

// ─────────────────────────────────────────────────────
// SECTION 10 — 404 HANDLER
// Catches requests to any URL that does not match a route.
// Returns a clear 404 error instead of crashing.
// ─────────────────────────────────────────────────────

// If no route matched the request URL, create a 404 error.
// This gets passed to the error middleware below.
app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

// ─────────────────────────────────────────────────────
// SECTION 11 — GLOBAL ERROR HANDLING
// This MUST come after all routes.
// Any error thrown in any controller or middleware
// is automatically sent here by Express.
// ─────────────────────────────────────────────────────

// errorMiddleware catches all errors thrown in the app
// and sends a consistent JSON error response.
// Handles Joi validation errors, JWT errors, MongoDB errors,
// custom AppErrors, and unexpected errors.
app.use(errorMiddleware);

// ─────────────────────────────────────────────────────
// SECTION 12 — START SERVER
// Start listening for incoming HTTP requests.
// ─────────────────────────────────────────────────────

// Use the PORT from .env or default to 5500
const PORT = process.env.PORT || 5500;

// Start the server and begin accepting requests.
// The server variable is used in the graceful shutdown below.
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ─────────────────────────────────────────────────────
// SECTION 13 — GRACEFUL SHUTDOWN
// When the server receives a stop signal (e.g., Ctrl+C
// or a Render deploy), it finishes in-progress requests
// before shutting down. This prevents data loss.
//
// HOW IT WORKS:
// 1. Signal received (SIGTERM from host or SIGINT from Ctrl+C)
// 2. Stop accepting new requests (server.close)
// 3. Wait for in-progress requests to finish
// 4. Close the MongoDB connection cleanly
// 5. Exit the process
// ─────────────────────────────────────────────────────

// shutdown — closes the server and database connection gracefully
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);

  // Stop accepting new connections, wait for existing ones to finish
  server.close(async () => {
    // Close the MongoDB connection after all requests are done
    await mongoose.connection.close();
    console.log("MongoDB connection closed. Process exiting.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown is taking too long
  // This prevents the server from hanging forever
  setTimeout(() => {
    process.exit(1);
  }, 10000);
}

// Listen for SIGTERM — sent by hosting providers (like Render) when deploying
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Listen for SIGINT — sent when user presses Ctrl+C in the terminal
process.on("SIGINT", () => shutdown("SIGINT"));
