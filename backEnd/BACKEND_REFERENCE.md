# BWPost Shift Management — Backend Reference
*Generated: April 6, 2026*  
*Stack: Node.js + Express + MongoDB + Mongoose*  
*Author: BWPost Development Team*

---

## 1. Project Overview

The BWPost Shift Management backend is a REST API built with Express and MongoDB. It supports three roles—**admin**, **manager**, and **employee**—for scheduling shifts, tracking attendance (check-in, check-out, breaks), handling leave and shift-change requests, and managing users through admin tools and **invite-based registration**.

HTTP-only cookies carry JWT access and refresh tokens so the browser can call protected routes without storing secrets in JavaScript. Business rules live in **services**; routes wire validation, authentication, and controllers. Sensitive actions are recorded in an **audit log** collection for traceability.

---

## 2. Tech Stack & Dependencies

| Package | Version | Purpose | Where used |
|---------|---------|---------|------------|
| bcrypt | ^6.0.0 | Password hashing (12 rounds in `userModel` pre-save) | `models/userModel.js` |
| cookie-parser | ^1.4.7 | Parse `Cookie` header into `req.cookies` | `server.js` |
| cors | ^2.8.5 | Cross-origin access with credentials | `server.js` |
| dotenv | ^17.2.3 | Load `.env` into `process.env` | `server.js`, scripts |
| express | ^4.21.2 | HTTP server and routing | `server.js`, `routes/*` |
| express-mongo-sanitize | ^2.2.0 | Mitigate NoSQL injection in user input | `server.js` |
| express-rate-limit | ^8.3.2 | Throttle auth, refresh, invites, global (prod) | `server.js`, `routes/userRoutes.js`, `routes/inviteRoutes.js` |
| helmet | ^8.1.0 | Set security-related HTTP headers (Helmet defaults) | `server.js` |
| joi | ^18.0.1 | Request body/query validation | `validators/*`, `middlewares/validate.js` |
| jsonwebtoken | ^9.0.2 | Sign/verify access and refresh JWTs | `middlewares/authMiddleware.js`, `services/userService.js` |
| mongoose | ^8.19.2 | MongoDB ODM, schemas, queries | `models/*`, `services/*`, `config/db.js` |
| morgan | ^1.10.1 | HTTP request logging (`dev` / `short`) | `server.js` |
| xss | ^1.0.15 | Sanitize `body`, `query`, `params` as JSON strings | `server.js` |
| nodemon | ^3.1.10 (dev) | Restart server on file changes | `npm run dev` |

---

## 3. Project Structure

```
backEnd/
├── server.js                 # Express app: security, CORS, routes, health, graceful shutdown
├── package.json              # Scripts and dependencies
├── .env / .env.example       # Environment (example documents variables; do not commit secrets)
├── config/
│   └── db.js                 # Mongoose connect with retry backoff
├── models/
│   ├── userModel.js          # User schema, bcrypt pre-save, soft-delete query hook
│   ├── shiftModel.js         # Shift schema and time validation
│   ├── attendanceModel.js    # Per-employee-per-shift attendance
│   ├── shiftRequestModel.js  # Leave / shift_change requests
│   ├── inviteModel.js        # Invite tokens and expiry
│   └── auditLogModel.js      # Append-only audit trail
├── routes/
│   ├── userRoutes.js         # /api/users
│   ├── adminRoutes.js        # /api/admin
│   ├── managerRoutes.js      # /api/manager/shifts
│   ├── employeeRoutes.js     # /api/employee/shifts
│   ├── requestRoutes.js      # /api/manager/requests
│   ├── attendanceRoutes.js   # /api/attendance
│   └── inviteRoutes.js       # /api/invites
├── controllers/              # Thin layer: call services, send JSON via apiResponse
├── services/                 # Business logic, audit calls, pagination
├── middlewares/
│   ├── authMiddleware.js     # JWT from cookie + role authorize()
│   ├── validate.js           # Joi body/query wrappers → AppError
│   └── errorHandler.js       # Global error formatting
├── validators/               # Joi schemas per domain
├── utils/
│   ├── AppError.js           # Operational errors with statusCode and optional data
│   ├── asyncHandler.js       # Promise.catch → next(err)
│   ├── apiResponse.js        # sendSuccess / sendError envelopes
│   ├── paginate.js           # getPaginationParams / getPaginationMeta
│   └── auditLog.js           # Fire-and-forget AuditLog.create
└── scripts/
    ├── seedAdmin.js          # Create initial admin (env-driven in production)
    ├── seedManagerEmployee.js # Dev manager + employee pair
    └── cleanDatabase.js      # Wipe non-kept users + related collections (no npm script)
```

---

## 4. Environment Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret for access JWT | 64-char hex |
| `REFRESH_TOKEN_SECRET` | Yes | Secret for refresh JWT | 64-char hex |
| `JWT_EXPIRES_IN` | Optional | Access token lifetime (passed to `jwt.sign`) | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Optional | Refresh token lifetime | `7d` |
| `PORT` | Optional | Listen port | `5500` |
| `NODE_ENV` | Optional | `production` enables stricter CORS, global rate limit, cookie `secure` | `development` |
| `ALLOWED_ORIGINS` | Optional | Comma-separated CORS origins | `https://bwpost-shift-management.vercel.app,http://localhost:5173` |
| `FRONTEND_URL` | Optional | Base URL for invite links (and future reset emails) | `http://localhost:5173` |
| `PASSWORD_RESET_EXPIRE_MS` | Optional | Reset token TTL in ms | `3600000` |
| `HEALTH_CHECK_SECRET` | Optional | If set, `/health` requires header `x-health-token` matching this value | long random string |
| `SEED_ADMIN_EMAIL` | Prod seed only | Admin email when `NODE_ENV=production` and running seed | `admin@bwpost.com` |
| `SEED_ADMIN_PASSWORD` | Prod seed only | Admin password (required in prod; not printed) | (secret) |
| `SEED_ADMIN_USERNAME` | Optional | Admin display name in seed | `Admin` |
| `DISABLE_PUBLIC_REGISTRATION` | N/A in code | Mentioned in `.env.example` only — **not read by application code**; public register is disabled in `userController` | — |

---

## 5. How To Run

1. **Install:** `cd backEnd && npm install`
2. **Configure:** Copy `.env.example` to `.env`; set `MONGO_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` (and optional vars above).
3. **Seed admin:** `npm run seed:admin`  
   - Dev default email/password: `admin@bwpost.com` / `Admin@123!` unless overridden by env.
4. **Seed manager + employee (dev):** `npm run seed:dev`  
   - Prints `manager@bwpost.de` / `Manager@123!` and `employee@bwpost.de` / `Employee@123!`.
5. **Development:** `npm run dev` (nodemon `server.js`).
6. **Production:** `npm start` (`node server.js`).
7. **Clean database (optional):** `node scripts/cleanDatabase.js` from `backEnd/` (keeps admin + listed emails; clears shifts, requests, attendance, invites, audit logs). **No `npm run clean:db` script** in `package.json`.

---

## 6. Database Credentials (Development)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bwpost.com` | `Admin@123!` (default from `seedAdmin.js` unless env overrides) |
| Manager | `manager@bwpost.de` | `Manager@123!` |
| Employee | `employee@bwpost.de` | `Employee@123!` |

---

## 7. Architecture Overview

| Layer | Job | Why separate | Without it |
|-------|-----|--------------|------------|
| **HTTP / Express** | Parse JSON, cookies, attach `req.id` | Framework boundary | No server |
| **Routes** | Map verbs/paths to middleware + controller | Declarative API surface | Unreachable handlers |
| **Middleware** | Auth, Joi validation, rate limits, CORS, errors | Cross-cutting concerns | Insecure or inconsistent input |
| **Controllers** | Orchestrate one request, call one service, respond | Thin, testable HTTP layer | Fat routes, duplicated JSON |
| **Services** | Rules, queries, transactions, audit | Reuse + unit-test business logic | Duplication across routes |
| **Models** | Schema, indexes, hooks | Single source of truth for persistence shape | Ad hoc documents, bugs |
| **Database** | Durable storage | — | No persistence |

---

## 8. Database Models

Mongoose **collection names** (default pluralization, lowercase): `users`, `shifts`, `attendances`, `shiftrequests`, `invites`, `auditlogs`.

### User

**Purpose:** Accounts for admin, manager, and employee with hierarchy and auth.  
**Collection:** `users`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| username | String | Yes | — | Display name |
| email | String | Yes | — | Unique, lowercased |
| password | String | Yes | — | Bcrypt hash; `select: false` |
| role | String enum | Yes | `employee` | `admin` \| `manager` \| `employee` |
| refreshToken | String | No | — | Current refresh JWT; `select: false` |
| passwordResetTokenHash | String | No | null | SHA-256 of raw reset token |
| passwordResetExpires | Date | No | null | Reset expiry |
| profileImage | String | No | `""` | HTTPS URL (Cloudinary / Unsplash validated in service) |
| managerId | ObjectId ref User | For employees | null | Reporting manager |
| isActive | Boolean | No | true | Soft delete flag |
| deactivatedAt | Date | No | null | When deactivated |
| deactivatedBy | ObjectId | No | null | Who deactivated |
| timestamps | — | Auto | createdAt, updatedAt | |

**Indexes:** `role`, `refreshToken`, `managerId`, `isActive`, compound `{ email, isActive }`, sparse `passwordResetTokenHash`.

**Business rules:** Pre-save: employees must have `managerId`. Pre-save: password hashed with bcrypt cost **12**. Pre-find: default query excludes `isActive: false` unless `_includeInactive` is set.

---

### Shift

**Purpose:** Scheduled work slot with capacity and assigned employees.  
**Collection:** `shifts`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| shiftTitle | String | Yes | — | |
| shiftStartTime | Date | Yes | — | |
| shiftEndTime | Date | Yes | — | Must be after start (pre-save) |
| createdByManager | ObjectId ref User | Yes | — | Owning manager |
| acceptedEmployees | [ObjectId] | No | [] | Assigned employees |
| shiftNotes | String | No | — | max 300 chars |
| slotsAvailable | Number | Yes | 1 | Open slots |
| timestamps | — | Auto | — | |

**Indexes:** `{ createdByManager, shiftStartTime }`, `{ shiftStartTime, slotsAvailable }`, `acceptedEmployees`, `{ createdByManager, createdAt }`.

---

### Attendance

**Purpose:** Check-in/out and breaks per employee per shift.  
**Collection:** `attendances`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| shift | ObjectId ref Shift | Yes | — | |
| employee | ObjectId ref User | Yes | — | |
| status | enum | No | `not_started` | `not_started` \| `checked_in` \| `on_break` \| `checked_out` |
| workSessions | [{ checkIn, checkOut }] | No | [] | |
| breaks | [{ start, end, type }] | No | [] | type: `lunch` \| `short_break` |
| totalWorkMinutes, totalBreakMinutes, overtimeMinutes | Number | No | 0 | Derived in service |
| isLate, lateByMins, leftEarly | Boolean/Number | No | false / 0 | |
| checkIn, checkOut | Date | No | — | Legacy convenience fields |
| totalHours | Number | No | 0 | |
| notes | String | No | — | max 300 |

**Indexes:** Unique `{ shift, employee }`; `{ shift, status }`; `{ employee, createdAt }`; `{ employee, checkIn }`.

---

### ShiftRequest

**Purpose:** Employee leave or shift-change workflow.  
**Collection:** `shiftrequests`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | enum | Yes | `leave` \| `shift_change` |
| employee | ObjectId | Yes | |
| currentShift | ObjectId | Yes | |
| requestedShift | ObjectId | No | Required for `shift_change` |
| reason | String | No | max 500 |
| status | enum | No `pending` | `pending` \| `approved` \| `rejected` |
| managerNote | String | No | max 300 |
| resolvedAt | Date | No | |

**Indexes:** `{ employee, status }`, `{ currentShift, status }`, compound on employee/currentShift/type/status.

---

### Invite

**Purpose:** Tokenized signup for a specific email and role.  
**Collection:** `invites`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | Lowercased |
| role | enum | Yes | `employee` \| `manager` \| `admin` |
| managerId | ObjectId | No | Set for employee invites |
| token | String | Yes | Unique hex from `generateToken()` |
| createdBy | ObjectId | Yes | Inviter |
| expiresAt | Date | Yes | Typically +7 days |
| usedAt | Date | No | When accepted |

**Indexes:** `{ email, usedAt }`, unique `token`.

---

### AuditLog

**Purpose:** Security and compliance trail.  
**Collection:** `auditlogs`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | String | Yes | e.g. `auth.login` |
| actorId | ObjectId | Yes | |
| actorRole | String | Yes | |
| targetType | String | No | e.g. `User`, `Shift` |
| targetId | ObjectId | No | |
| details | Mixed | No | |
| ip | String | No | |
| userAgent | String | No | |

**Indexes:** `{ actorId, createdAt }`, `{ action, createdAt }`, `{ targetType, targetId }`.

---

## 9. API Endpoints — Complete Reference

**Auth:** Cookie names `token` (access) and `refreshToken`. Access JWT payload: `{ id, role }`. Refresh: `{ id }`.

**Success shape:** `{ success: true, data?, message?, pagination? }`.  
**Error shape:** `{ success: false, error: string, data?: { errors?: [...], stack? (dev) } }`.

### Auth & Users (`/api/users`)

| Method | Endpoint | Auth | Role | Body / query | Returns | Description |
|--------|----------|------|------|--------------|---------|-------------|
| GET | `/api/users/registration-status` | No | — | — | `{ publicRegistrationEnabled: false }` | Registration flag (from `userService.getRegistrationStatus`) |
| POST | `/api/users/register` | No | — | registerSchema | 403 | Public registration disabled |
| POST | `/api/users/login` | No | — | email, password | 200 + Set-Cookie | Login; rate limit 10 / 15 min |
| POST | `/api/users/logout` | Cookie | — | — | 200 | Clears refresh in DB + cookies |
| POST | `/api/users/refresh-token` | Cookie refresh | — | — | 200 + Set-Cookie | New tokens; rate limit 30 / 15 min |
| GET | `/api/users/me` | Cookie | Any active | — | user profile | Current user |
| PUT | `/api/users/profile` | Cookie | Any active | username?, profileImage? | Updated user | HTTPS image URL rules |
| POST | `/api/users/forgot-password` | No | — | email | Generic message | Creates reset token; **email not sent** (TODO SES) |
| GET | `/api/users/reset-password/validate/:token` | No | — | — | `{ valid: true }` | Token format + DB check |
| POST | `/api/users/reset-password` | No | — | token, password | Message | Completes reset; clears sessions |

### Admin (`/api/admin`)

All routes: `auth` + `authorize("admin")`.

| Method | Endpoint | Auth | Role | Body / query | Returns | Description |
|--------|----------|------|------|--------------|---------|-------------|
| GET | `/api/admin/users` | Cookie | admin | page, limit, search, role, includeInactive | Users + pagination | List users |
| POST | `/api/admin/users` | Cookie | admin | createUserSchema | Created user | Create any role |
| PUT | `/api/admin/users/:userId/role` | Cookie | admin | updateUserRoleSchema | Updated user | Change role / manager |

### Manager shifts & team (`/api/manager/shifts`)

| Method | Endpoint | Auth | Role | Body / query | Returns | Description |
|--------|----------|------|------|--------------|---------|-------------|
| GET | `/api/manager/shifts/public` | Cookie | any | page, limit | Upcoming shifts with slots | Paginated catalog |
| POST | `/api/manager/shifts` | Cookie | admin, manager | createShiftSchema | Shift | Create shift |
| GET | `/api/manager/shifts` | Cookie | admin, manager | getShiftsQuerySchema | Shifts + pagination | Manager scoped; admin sees all |
| GET | `/api/manager/shifts/dashboard/data` | Cookie | admin, manager | — | Dashboard DTO | Stats for layout/widgets |
| POST | `/api/manager/shifts/employees` | Cookie | admin, manager | createEmployeeSchema | Employee | Create under logged-in manager |
| GET | `/api/manager/shifts/employees` | Cookie | admin, manager | page, limit, search | Employees + pagination | |
| GET | `/api/manager/shifts/employees/:employeeId` | Cookie | admin, manager | — | Employee | |
| PUT | `/api/manager/shifts/employees/:employeeId` | Cookie | admin, manager | updateEmployeeSchema | Employee | username/email |
| DELETE | `/api/manager/shifts/employees/:employeeId` | Cookie | admin, manager | — | Message | Soft-deactivate |
| GET | `/api/manager/shifts/employees/:employeeId/attendance` | Cookie | admin, manager | page, limit, startDate?, endDate? | History + pagination | |
| GET | `/api/manager/shifts/shift-accepted-employees/:shiftId` | Cookie | admin, manager | — | acceptedEmployees | Manager must own shift |
| POST | `/api/manager/shifts/shift/assign-employee` | Cookie | admin, manager | assignEmployeeSchema | Message | Direct assign + overlap check |
| POST | `/api/manager/shifts/shift/remove-employee` | Cookie | admin, manager | removeEmployeeSchema | Message | Remove + attendance cleanup |
| GET | `/api/manager/shifts/:shiftId` | Cookie | admin, manager | — | Shift | Manager ownership for managers |
| PUT | `/api/manager/shifts/:shiftId` | Cookie | admin, manager | updateShiftSchema | Shift | |
| DELETE | `/api/manager/shifts/:shiftId` | Cookie | admin, manager | — | Message | Cancels pending requests on shift |

### Employee (`/api/employee/shifts`)

| Method | Endpoint | Auth | Role | Body / query | Returns | Description |
|--------|----------|------|------|--------------|---------|-------------|
| GET | `/api/employee/shifts/available-shifts` | Cookie | employee | page, limit | Shifts + pagination | Apply pool |
| GET | `/api/employee/shifts/myshifts` | Cookie | employee | page, limit | Shifts + pagination | Accepted shifts |
| POST | `/api/employee/shifts/applyForShift` | Cookie | employee | shiftId | Message | Self-apply |
| POST | `/api/employee/shifts/cancelShift` | Cookie | employee | shiftId | Message | Leave slot |
| POST | `/api/employee/shifts/requests/leave` | Cookie | employee | shiftId, reason? | ShiftRequest | |
| POST | `/api/employee/shifts/requests/shift-change` | Cookie | employee | currentShiftId, requestedShiftId, reason? | ShiftRequest | |
| GET | `/api/employee/shifts/requests` | Cookie | employee | page, limit | Requests + pagination | |

### Attendance (`/api/attendance`)

| Method | Endpoint | Auth | Role | Body | Returns | Description |
|--------|----------|------|------|------|---------|-------------|
| POST | `/api/attendance/checkin` | Cookie | any | shiftId, employeeId? | Attendance | Manager/admin may pass `employeeId` |
| POST | `/api/attendance/checkout` | Cookie | any | shiftId, employeeId?, notes? | Attendance | |
| POST | `/api/attendance/break/start` | Cookie | any | shiftId, type?, employeeId? | Attendance | |
| POST | `/api/attendance/break/end` | Cookie | any | shiftId, employeeId? | Attendance | |
| GET | `/api/attendance/my/:shiftId` | Cookie | any | — | shift + attendance | Own record |
| GET | `/api/attendance/shift/:shiftId` | Cookie | admin, manager | — | shift + per-employee rows | Manager owns shift |

### Invites (`/api/invites`)

| Method | Endpoint | Auth | Role | Body / params | Returns | Description |
|--------|----------|------|------|---------------|---------|-------------|
| GET | `/api/invites/validate/:token` | No | — | — | email, role | Public; rate limit 20 / 15 min |
| POST | `/api/invites/accept` | No | — | acceptInviteSchema | Message | Creates user; public rate limit |
| GET | `/api/invites` | Cookie | admin, manager | page, limit, used? | Invites + pagination | Manager sees own-related |
| POST | `/api/invites` | Cookie | admin, manager | createInviteSchema | invite + inviteLink | Manager: employees only |

### Requests (`/api/manager/requests`)

| Method | Endpoint | Auth | Role | Body / query | Returns | Description |
|--------|----------|------|------|--------------|---------|-------------|
| GET | `/api/manager/requests` | Cookie | admin, manager | getRequestsQuerySchema | Requests + pagination | Admin: all manager-linked via shifts |
| PUT | `/api/manager/requests/:id/approve` | Cookie | admin, manager | approveRequestSchema | Request | Uses Mongo **session transaction** |
| PUT | `/api/manager/requests/:id/reject` | Cookie | admin, manager | rejectRequestSchema | Request | Uses transaction |

### Root

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | `{ success: true, message: "Backend is running" }` |
| GET | `/health` | Optional header | DB state; 401 if `HEALTH_CHECK_SECRET` set and `x-health-token` wrong |

---

## 10. Services — Business Logic

### `userService.js`

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getRegistrationStatus` | — | `{ publicRegistrationEnabled: false }` | Static flag |
| `getCookieOptions` / `getClearCookieOptions` | maxAge? | Cookie options | httpOnly; `secure` + `sameSite: none` in production |
| `login` | email, password | tokens + user + userDoc | Validates, stores refresh hash |
| `refreshAccessToken` | refreshToken | new tokens | Rotates refresh if valid |
| `logout` | refreshToken | void | Clears stored refresh |
| `getMe` | userId | safe user object | |
| `updateProfile` | req, userId, body | user | Validates image hosts |
| `requestPasswordReset` | req, email | message | Generic response |
| `validatePasswordResetToken` | rawToken | `{ valid: true }` | |
| `resetPasswordWithToken` | req, { token, password } | message | Clears refresh |

### `adminService.js`

| Function | Description |
|----------|-------------|
| `createUser` | Validates role/manager; creates user; audit `user.create`, `user.assign_manager` |
| `updateUserRole` | Role change + manager rules; audit `user.role_change` |
| `getAllUsers` | Paginated search/filter |

### `teamService.js`

| Function | Description |
|----------|-------------|
| `getAllEmployees` | Manager-scoped list |
| `createEmployee` | Under manager; audit `user.create` |
| `updateEmployee` | username/email; audit `manager.employee.update` |
| `deleteEmployee` | Pull from shifts, soft-deactivate; audit `user.deactivate` |
| `getEmployeeById` | Access check |
| `getEmployeeAttendanceHistory` | Paginated with optional date filter on shifts |

### `shiftService.js`

| Function | Description |
|----------|-------------|
| `getAllShiftsPublic` | Future shifts with open slots |
| `createShift` | audit `shift.create` |
| `getAllShiftsManager` | Filters: status, search, date range, sort |
| `getShiftById` | Manager ownership |
| `updateShift` | audit `shift.update` |
| `deleteShift` | Rejects pending requests; audit `shift.delete`, `SHIFT_DELETED_REQUESTS_CANCELLED` |
| `getShiftAcceptedEmployees` | |
| `removeEmployeeFromShift` | audit `shift.remove_employee`, `ATTENDANCE_CLEANED_ON_REMOVE` |
| `assignEmployeeToShift` | Overlap detection; audit `shift.assign_employee` |

### `employeeShiftService.js`

| Function | Description |
|----------|-------------|
| `getAvailableShifts` / `getMyShifts` | Paginated |
| `applyForShift` / `cancelShiftApplication` | audit `employee.shift.apply` / `employee.shift.cancel` |
| `submitLeaveRequest` / `submitShiftChangeRequest` | audit `employee.request.leave` / `employee.request.shift_change` |
| `getMyRequests` | Paginated |

### `shiftRequestService.js`

| Function | Description |
|----------|-------------|
| `getAllRequests` | Manager: shifts owned; filters status/type/dates/employee |
| `approveRequest` | **Transaction:** leave pull + slot; or shift_change atomic swap |
| `rejectRequest` | **Transaction:** status update |

**Important:** `approveRequest` / `rejectRequest` require a MongoDB deployment that supports **multi-document transactions** (e.g. replica set). `.env.example` notes Atlas M2+ for transactions.

### `attendanceService.js`

| Function | Description |
|----------|-------------|
| `checkIn`, `checkOut`, `startBreak`, `endBreak` | Rules for status transitions; manager scope; audit `attendance.*` |
| `getShiftAttendance` | Merges shift employees with attendance docs |
| `getMyAttendance` | Employee self |

### `inviteService.js`

| Function | Description |
|----------|-------------|
| `createInvite` | Manager vs admin rules; 7-day expiry; audit `invite.create` |
| `validateInviteToken` | |
| `acceptInvite` | Mark used + `User.create`; audit `invite.accept` with actor override |
| `getAllInvites` | Paginated + `used` filter |

### `dashboardService.js`

| Function | Description |
|----------|-------------|
| `getDashboardData` | Aggregates employees, shifts, capacity %, today attendance, notifications, recent shifts |

---

## 11. Authentication Flow

1. **Login:** `POST /api/users/login` → `userService.login` issues access JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`) and refresh JWT (`REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`). Controller sets cookies: access **15 minutes** (`15 * 60 * 1000` ms hardcoded), refresh **7 days** (hardcoded ms). Audit `auth.login`.
2. **Refresh:** `POST /api/users/refresh-token` reads `refreshToken` cookie, verifies, compares to DB, rotates both tokens and cookies.
3. **Protected routes:** `auth` reads `req.cookies.token`, verifies with `JWT_SECRET`, loads user active flag, sets `req.user = { id, role }`. `authorize(...roles)` checks role.
4. **Logout:** `POST /api/users/logout` clears refresh in DB if present; `clearCookie` for both cookies.
5. **Cookies:** Development: `secure: false`, `sameSite: "lax"`. Production: `secure: true`, `sameSite: "none"` (cross-site to Vercel). `httpOnly: true`, `path: "/"`.

---

## 12. Security Measures

- **Rate limiting:** Global 100 req / 15 min per IP **in production only** (`server.js`). Per-route: login/register/forgot/reset/validate reset — **10 / 15 min**; refresh — **30 / 15 min**; invite public endpoints — **20 / 15 min**.
- **CORS:** `ALLOWED_ORIGINS` or defaults including Vercel URL and `http://localhost:5173`; `credentials: true`. No `Origin` in production → blocked; allowed in dev for tooling.
- **Origin CSRF-style gate:** Non-GET requests require `Origin` in `allowedOrigins` if `Origin` header is sent (`csrfProtect` in `server.js`).
- **Helmet:** Default security headers.
- **Body limit:** `express.json({ limit: "10kb" })`.
- **mongoSanitize + xss:** Sanitize injection / XSS on body, query, params.
- **JWT:** Access in cookie `token`; refresh in `refreshToken`; refresh stored server-side on user.
- **Passwords:** bcrypt **12** rounds on save.
- **Joi:** Validators on bodies and selected queries.
- **Trust proxy:** `app.set("trust proxy", 1)` for correct `req.ip` behind Render.

---

## 13. Invite & Registration Flow

1. **Admin or manager** calls `POST /api/invites` with email, role, and optional `managerId` (admin inviting employee).
2. **Token:** 64 hex chars (`Invite.generateToken()`), stored with **7-day** `expiresAt`.
3. **Link:** `${FRONTEND_URL || "http://localhost:5173"}/register?invite=${token}` returned in API.
4. **Register:** User opens link → `GET /api/invites/validate/:token` → form with fixed email → `POST /api/invites/accept` with `token`, `username`, `password`.
5. **managerId:** Copied from invite onto new user when role is employee (manager-created invites set inviter; admin sets explicit manager).
6. **Activation:** User is active by default (`isActive: true`). Public `POST /api/users/register` returns **403** (invite-only).

---

## 14. Pagination

- **Helpers:** `getPaginationParams(query, defaultLimit=20, maxLimit=50)` → `{ page, limit, skip }`; `getPaginationMeta(total, page, limit)` → `{ total, page, limit, totalPages }`.
- **Defaults:** page `1`, limit `20`, max cap **`50`**.
- **Response:** Top-level `pagination` object on success (see `sendSuccess` in `apiResponse.js`).
- **Endpoints using it:** manager shift list, public shifts, employees list, employee shifts/requests, admin users, invites list, manager requests list, employee attendance history.

---

## 15. Error Handling

- **`AppError`:** `message`, `statusCode`, optional `data` (e.g. Joi field errors).
- **`asyncHandler`:** Wraps async controllers so `next(err)` runs.
- **`errorHandler`:** Maps Mongoose `ValidationError`, `CastError`, duplicate key `11000`, JWT errors, and `AppError` to JSON `{ success: false, error }` plus optional `data` (and `stack` in development for any error).

---

## 16. Audit Logging

| Action | Service / controller | Details (typical) |
|--------|----------------------|-------------------|
| `auth.login` | `userController` | email, role |
| `auth.password_reset_requested` | `userService` | email |
| `auth.password_reset_completed` | `userService` | email |
| `user.profile.update` | `userService` | updatedFields |
| `user.create` | `adminService`, `teamService` | role, email |
| `user.assign_manager` | `adminService` | managerId |
| `user.role_change` | `adminService` | previousRole, newRole |
| `user.deactivate` | `teamService` | email, role |
| `manager.employee.update` | `teamService` | updatedFields |
| `invite.create` | `inviteService` | email, role |
| `invite.accept` | `inviteService` | inviteId (actor = new user) |
| `shift.create` / `update` / `delete` | `shiftService` | titles, ids |
| `SHIFT_DELETED_REQUESTS_CANCELLED` | `shiftService` | cancelled count |
| `shift.remove_employee` / `shift.assign_employee` | `shiftService` | |
| `ATTENDANCE_CLEANED_ON_REMOVE` | `shiftService` | |
| `employee.shift.apply` / `cancel` | `employeeShiftService` | |
| `employee.request.leave` / `shift_change` | `employeeShiftService` | |
| `request.approve` / `request.reject` | `shiftRequestService` | type, employee, shifts |
| `attendance.checkin` / `checkout` / `break.start` / `break.end` | `attendanceService` | shiftId, employeeId |

---

## 17. Known Limitations & Future Work

- **Password reset email:** Not sent; `userService.requestPasswordReset` has TODO for AWS SES (link commented).
- **Invite email:** No automated email; admins copy invite link from API/UI.
- **Public registration:** Always disabled in controller (not env-driven despite `.env.example` comment).
- **S3 file uploads:** Not implemented; profile images use HTTPS URLs (Cloudinary / Unsplash validation).
- **Transactions:** `shiftRequestService` approve/reject require replica set; local standalone MongoDB may fail.
- **Tests:** `npm test` is a placeholder in `package.json`.

---

## 18. Deployment

- **Typical hosting:** Backend on **Render** (per project docs); **MongoDB Atlas** for database.
- **Env on host:** Set all required secrets, `NODE_ENV=production`, `ALLOWED_ORIGINS` to the Vercel frontend URL, `FRONTEND_URL` to the same.
- **Health:** `GET /health` — optional `HEALTH_CHECK_SECRET` + `x-health-token`.
- **Graceful shutdown:** `SIGTERM` / `SIGINT` → `server.close()` then `mongoose.connection.close()`; force exit after 10s timeout.

---

*End of backend reference.*
