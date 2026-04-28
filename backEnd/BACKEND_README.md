# BWPost Shift Management — Backend

## What This Is

This backend is the **BWPost Shift Management API**. It is a **Node.js** server built with **Express.js**.

It connects to **MongoDB** and exposes REST endpoints for the React frontend.

Managers manage shifts and approvals; employees check in and apply for shifts; admins oversee users and audit trails.

---

## Tech Stack

| Technology | Role |
|------------|------|
| **Node.js** | JavaScript runtime |
| **Express.js** | HTTP routes and middleware |
| **MongoDB** + **Mongoose** | Database and schemas |
| **JWT** | Signing tokens for logged-in users |
| **bcrypt** | Hashing passwords before storing |
| **node-cron** | Scheduled background jobs |
| **Joi** | Checking incoming request data |
| **Helmet** | Extra HTTP security headers |
| **cors** | Allowing requests from the frontend origin |
| **cookie-parser** | Reading JWT cookies on requests |

Other helpers worth mentioning: **express-rate-limit**, **express-mongo-sanitize**, **morgan**, **dotenv**, **googleapis** (Drive backup script).

---

## Folder Structure

Everything below lives under `backEnd/`.

```
backEnd/
  server.js              — Main entry: loads env, connects DB, mounts routes, starts listening
  config/
    db.js                — Opens MongoDB connection (with retry logic)
  models/                — Mongoose schemas (collections)
    User.js              — Accounts (admin / manager / employee)
    Shift.js             — Work shifts created by managers
    Attendance.js        — Check-in, check-out, break records
    ShiftRequest.js      — Leave and shift-change requests
    Invite.js            — Invite links for onboarding
    Notification.js      — In-app notifications for the bell icon
    AuditLog.js          — Who did what and when
  controllers/           — Feature logic (called from routes)
    authController.js           — Login, logout, profile, password reset, sessions
    shiftController.js          — Shifts, dashboard data, CSV export, employee CRUD under shifts
    attendanceController.js   — Check-in/out, breaks, weekly hours, per-shift attendance
    employeeController.js      — Employee-facing shift browse / apply / cancel / requests
    requestController.js       — Manager approve / reject requests
    inviteController.js        — Create and validate invites, accept registration
    notificationController.js — List notifications, mark read
    adminController.js         — Users, roles, audit logs, admin reset links
    dashboardController.js    — Aggregates for dashboards (where used)
  routes/                — Maps URLs to controllers + middleware
    authRoutes.js               — `/api/users`
    shiftRoutes.js              — `/api/manager/shifts`
    employeeRoutes.js           — `/api/employee/shifts`
    attendanceRoutes.js       — `/api/attendance`
    requestRoutes.js            — `/api/manager/requests`
    inviteRoutes.js             — `/api/invites`
    notificationRoutes.js       — `/api/notifications`
    adminRoutes.js              — `/api/admin`
  middleware/            — Runs before controllers
    authMiddleware.js    — Validates JWT from cookies; loads current user
    checkRole.js           — Ensures role (admin / manager / employee)
    errorMiddleware.js     — Central error handler
    validateInput.js       — Joi validation for body/query/params
  helpers/                 — Small shared utilities
    generateToken.js      — Issues JWTs and sets HTTP-only cookies
    sendResponse.js       — Consistent JSON shape for success/error
    auditLogger.js        — Writes audit log rows
    pagination.js         — Parses skip/limit for lists
    calculateHours.js     — Weekly hours and related math
    csvHelper.js          — Safe CSV generation for exports
    asyncHandler.js       — Catches async errors for Express
    AppError.js           — Custom errors with status codes
    hashToken.js          — Hashing tokens for storage
    frontendUrl.js        — Builds frontend URLs from env
    securityLog.js        — Security-related logging
  validation/             — Joi schemas grouped by feature
    authValidation.js           — Login, profile, password flows
    shiftValidation.js          — Shifts and related manager actions
    attendanceValidation.js    — Check-in/out and breaks
    inviteValidation.js        — Invites
    requestValidation.js       — Leave / shift-change payloads
    employeeValidation.js    — Employee creation / updates under manager
    adminValidation.js       — Admin user and role updates
  cron/                   — Scheduled jobs
    autoCheckout.js       — Finds late check-outs after shift end
    cronJobs.js           — Registers and starts cron schedules
  scripts/                — Runnable one-off / maintenance scripts
    seedAdmin.js          — `npm run seed:admin` — bootstrap admin
    seedData.js           — `npm run seed:dev` — dev users / reset dev passwords
    backupDatabase.js     — `npm run backup` — backup to Google Drive (when configured)
```

*(Order of route registration matters for Express: more specific paths like `/dashboard/data` are registered before `/:shiftId`. )*

---

## How To Run Locally

**Step 1 — Install packages**

```bash
cd backEnd
npm install
```

**Step 2 — Environment**

- Copy `.env.example` to `.env`.
- Set `MONGO_URI`, JWT secrets, allowed origins, frontend URL, and any seed emails/passwords you use.

**Step 3 — Seed admin (first setup)**

```bash
npm run seed:admin
```

**Step 4 — Seed dev users (optional)**

```bash
npm run seed:dev
```
Runs `scripts/seedData.js` only (no server).

**Step 5 — Start dev server**

```bash
npm run dev
```
Runs `seedData.js` once, then starts `nodemon server.js` so the API reloads on file changes. Default port is usually **5500** if set in `.env`.

---

## All API Endpoints

Base paths are composed with `server.js` (for example `/api/users` is mounted from `authRoutes.js`).

### Authentication (`/api/users`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/users/login` | Login; sets JWT HTTP-only cookies |
| POST | `/api/users/logout` | Clears cookies / session |
| POST | `/api/users/refresh-token` | New access token using refresh cookie |
| GET | `/api/users/me` | Current user profile |
| PUT | `/api/users/profile` | Update profile fields |
| POST | `/api/users/forgot-password` | Returns reset payload (email sending may be off in dev) |
| GET | `/api/users/reset-password/validate/:token` | Check if reset token still valid |
| POST | `/api/users/reset-password` | Set new password with token |

*Extra auth-related routes in code: registration status, sessions listing, logout-all devices — see `authRoutes.js`.*

### Shifts (`/api/manager/shifts`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/manager/shifts` | List shifts (pagination & filters) |
| POST | `/api/manager/shifts` | Create shift; eligible employees can be notified |
| GET | `/api/manager/shifts/:shiftId` | Single shift |
| PUT | `/api/manager/shifts/:shiftId` | Update shift |
| DELETE | `/api/manager/shifts/:shiftId` | Delete shift |
| GET | `/api/manager/shifts/dashboard/data` | Dashboard aggregates |
| GET | `/api/manager/shifts/export/csv` | CSV download |

*Also available on the same mount: public shift listing, employee CRUD under shifts, assign/remove employees — see `shiftRoutes.js`.*

### Employee shifts (`/api/employee/shifts`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/employee/shifts/available-shifts` | Shifts employee can apply for |
| GET | `/api/employee/shifts/myshifts` | Assigned / accepted shifts |
| POST | `/api/employee/shifts/applyForShift` | Apply for a shift |
| POST | `/api/employee/shifts/cancelShift` | Cancel an application |
| POST | `/api/employee/shifts/requests/leave` | Leave request |
| POST | `/api/employee/shifts/requests/shift-change` | Shift-change request |
| GET | `/api/employee/shifts/requests` | Employee’s own requests |

### Attendance (`/api/attendance`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/attendance/checkin` | Check in |
| POST | `/api/attendance/checkout` | Check out |
| POST | `/api/attendance/break/start` | Start break |
| POST | `/api/attendance/break/end` | End break |
| GET | `/api/attendance/my/:shiftId` | My attendance for one shift |
| GET | `/api/attendance/shift/:shiftId` | All attendance for shift (manager/admin) |
| GET | `/api/attendance/weekly-hours` | Weekly totals (employee role) |

### Requests (`/api/manager/requests`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/manager/requests` | List requests for this manager |
| PUT | `/api/manager/requests/:id/approve` | Approve |
| PUT | `/api/manager/requests/:id/reject` | Reject |

### Invites (`/api/invites`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/invites` | List invites |
| POST | `/api/invites` | Create invite |
| GET | `/api/invites/validate/:token` | Validate token before signup |
| POST | `/api/invites/accept` | Register via invite |

### Notifications (`/api/notifications`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/notifications` | List my notifications |
| PUT | `/api/notifications/read-all` | Mark all read |
| PUT | `/api/notifications/:id/read` | Mark one read |

### Admin (`/api/admin`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/users` | All users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:userId/role` | Change role |
| POST | `/api/admin/users/:userId/reset-password-link` | Generate reset link |
| GET | `/api/admin/audit-logs` | Audit entries |

---

## How Authentication Works

1. Client sends **email + password** to `POST /api/users/login`.
2. Server loads the user from MongoDB and compares password with **bcrypt**.
3. On success it creates **two JWTs**: short-lived **access** token and longer-lived **refresh** token (exact lifetimes come from `.env`).
4. Tokens are placed in **HTTP-only cookies** (not readable by frontend JS).
5. Browser sends cookies automatically on later requests.
6. Middleware verifies the access token on protected routes.
7. When the access token expires, the client calls **`POST /api/users/refresh-token`** (often via Axios interceptor) to rotate cookies.
8. **Logout** clears cookies server-side.

---

## Why HTTP-Only Cookies

We store JWTs in **HTTP-only cookies** instead of `localStorage`.

- Page scripts cannot read HTTP-only cookies, which **reduces XSS token theft**.
- The browser attaches cookies to API calls automatically — no manual `Authorization` header in frontend code for basic flows.

---

## Smart Notifications (40-hour rule)

When a manager **creates a shift**, the backend can notify employees who are **eligible**.

The system checks how many hours each employee already worked **this week**. Workers **under the weekly cap** (aligned with common **German labor practice**, often summarized as **40 hours**) can get a notification so people already at full hours are not spammed.

---

## Auto checkout (cron)

A **node-cron** job runs on a fixed interval (for example **every 10 minutes** — see `cron/`).

It finds attendance rows where the employee is **still checked in** but the **shift end time has passed**, then performs an automatic **checkout** at the scheduled end time and can **notify** the employee. This avoids stuck “always checked in” states when someone forgets to clock out.

---

## User Roles

| Role | Responsibility |
|------|------------------|
| **Admin** | Full access: users, roles, invites, audit logs |
| **Manager** | Own team: shifts, attendance, approvals, exports |
| **Employee** | Apply to shifts, check in/out, requests, own data |

---

*For a machine-readable list of every route, see `QUICK_REFERENCE.md` at the repo root or scan the `routes/` files.*
