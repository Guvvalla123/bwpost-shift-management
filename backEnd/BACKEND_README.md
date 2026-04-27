# BWPost Backend

## What This Is

The backend API server for the BWPost Shift Management System.
Built with Node.js, Express and MongoDB.

It handles user authentication, shift management, attendance
tracking, leave requests, notifications, and admin operations.

---

## Folder Structure

### `config/`
Database connection setup.
`db.js` connects to MongoDB Atlas with retry logic.

### `models/`
MongoDB database schemas. Each file defines one collection.

| File | Collection | What It Stores |
|---|---|---|
| `User.js` | users | Employees, managers, admins |
| `Shift.js` | shifts | Work shifts |
| `Attendance.js` | attendances | Check-in and check-out records |
| `ShiftRequest.js` | shiftrequests | Leave and shift-change requests |
| `Invite.js` | invites | Registration invite links |
| `AuditLog.js` | auditlogs | Record of important actions |
| `Notification.js` | notifications | Bell icon notifications |

### `controllers/`
Business logic for each feature. Each file handles one area.

| File | What It Does |
|---|---|
| `authController.js` | Login, logout, register, password reset |
| `shiftController.js` | Create, edit, delete shifts |
| `attendanceController.js` | Check-in, check-out, breaks |
| `employeeController.js` | Manage employees under a manager |
| `requestController.js` | Leave and shift-change requests |
| `inviteController.js` | Create and accept invite links |
| `notificationController.js` | Read and mark notifications |
| `adminController.js` | Admin user management and audit logs |
| `dashboardController.js` | Dashboard statistics |

### `routes/`
API endpoints. Each file connects URLs to controllers.

| File | Base URL |
|---|---|
| `authRoutes.js` | `/api/users` |
| `shiftRoutes.js` | `/api/manager/shifts` |
| `employeeRoutes.js` | `/api/employee/shifts` |
| `attendanceRoutes.js` | `/api/attendance` |
| `requestRoutes.js` | `/api/manager/requests` |
| `inviteRoutes.js` | `/api/invites` |
| `notificationRoutes.js` | `/api/notifications` |
| `adminRoutes.js` | `/api/admin` |

### `middleware/`
Code that runs before every request reaches a controller.

| File | What It Does |
|---|---|
| `authMiddleware.js` | Checks if user is logged in (reads JWT cookie) |
| `checkRole.js` | Checks if user has the correct role |
| `errorMiddleware.js` | Catches all errors and sends a proper response |
| `validateInput.js` | Validates request body using Joi schemas |

### `helpers/`
Small reusable functions used across the whole codebase.

| File | What It Does |
|---|---|
| `generateToken.js` | Creates JWT tokens and stores them in cookies |
| `sendResponse.js` | Sends consistent JSON responses |
| `auditLogger.js` | Saves audit records to the database |
| `pagination.js` | Handles page and limit query params |
| `calculateHours.js` | Calculates weekly hours worked |
| `csvHelper.js` | Converts data to CSV and sanitizes it |
| `hashToken.js` | Hashes tokens with SHA256 |
| `AppError.js` | Custom error class with status code |
| `asyncHandler.js` | Wraps async functions to catch errors |
| `frontendUrl.js` | Builds frontend URLs for links |
| `securityLog.js` | Logs security events to console |

### `validation/`
Joi schemas that define rules for request data.

| File | Validates |
|---|---|
| `authValidation.js` | Login, register, password reset data |
| `shiftValidation.js` | Shift create and update data |
| `attendanceValidation.js` | Check-in, check-out, break data |
| `employeeValidation.js` | Employee create, update, apply for shift data |
| `requestValidation.js` | Leave and shift-change request data |
| `inviteValidation.js` | Invite create and accept data |
| `adminValidation.js` | Admin user create and role update data |

### `cron/`
Scheduled background jobs that run automatically.

| File | What It Does |
|---|---|
| `autoCheckout.js` | Auto-checkout logic (runs every 10 minutes) |
| `cronJobs.js` | Starts all cron jobs after database connects |

### `scripts/`
One-time setup and development scripts.

| File | Command | What It Does |
|---|---|---|
| `seedAdmin.js` | `npm run seed:admin` | Creates the first admin account |
| `seedData.js` | `npm run seed:dev` | Creates test manager + employee accounts |
| `backupDatabase.js` | `npm run backup` | Backs up database to Google Drive |

---

## How To Run

### Install packages
```
npm install
```

### Create .env file
```
Copy .env.example to .env
Fill in your MongoDB URI and secret keys
```

### Start development server
```
npm run dev
```
This seeds test accounts and starts the server with auto-reload.

### Start production server
```
npm start
```

### Create admin account (run once on first setup)
```
npm run seed:admin
```

### Create test accounts (development only)
```
npm run seed:dev
```

---

## API Routes

### Authentication — `/api/users`

| Method | URL | Who | What |
|---|---|---|---|
| POST | `/api/users/login` | Anyone | Login with email and password |
| POST | `/api/users/logout` | Anyone | Logout and clear cookies |
| POST | `/api/users/refresh-token` | Anyone | Get new access token |
| GET | `/api/users/me` | Logged in | Get my profile |
| PUT | `/api/users/profile` | Logged in | Update my profile |
| POST | `/api/users/forgot-password` | Anyone | Get password reset link |
| POST | `/api/users/reset-password` | Anyone | Set new password |

### Shifts — `/api/manager/shifts`

| Method | URL | Who | What |
|---|---|---|---|
| GET | `/api/manager/shifts` | Manager/Admin | List all shifts |
| POST | `/api/manager/shifts` | Manager/Admin | Create new shift |
| GET | `/api/manager/shifts/:id` | Manager/Admin | Get one shift |
| PUT | `/api/manager/shifts/:id` | Manager/Admin | Update a shift |
| DELETE | `/api/manager/shifts/:id` | Manager/Admin | Delete a shift |
| GET | `/api/manager/shifts/dashboard/data` | Manager/Admin | Dashboard stats |
| GET | `/api/manager/shifts/export/csv` | Manager/Admin | Export CSV |
| GET | `/api/manager/shifts/employees` | Manager/Admin | List employees |
| POST | `/api/manager/shifts/employees` | Manager/Admin | Add employee |

### Employee Shifts — `/api/employee/shifts`

| Method | URL | Who | What |
|---|---|---|---|
| GET | `/api/employee/shifts/available-shifts` | Employee | Browse open shifts |
| GET | `/api/employee/shifts/myshifts` | Employee | My work schedule |
| POST | `/api/employee/shifts/applyForShift` | Employee | Apply for a shift |
| POST | `/api/employee/shifts/cancelShift` | Employee | Cancel application |
| POST | `/api/employee/shifts/requests/leave` | Employee | Submit leave request |
| GET | `/api/employee/shifts/requests` | Employee | View my requests |

### Attendance — `/api/attendance`

| Method | URL | Who | What |
|---|---|---|---|
| POST | `/api/attendance/checkin` | Logged in | Check in to shift |
| POST | `/api/attendance/checkout` | Logged in | Check out of shift |
| POST | `/api/attendance/break/start` | Logged in | Start a break |
| POST | `/api/attendance/break/end` | Logged in | End a break |
| GET | `/api/attendance/weekly-hours` | Employee | Get hours this week |
| GET | `/api/attendance/my/:shiftId` | Logged in | My attendance for a shift |
| GET | `/api/attendance/shift/:shiftId` | Manager/Admin | All attendance for a shift |

### Notifications — `/api/notifications`

| Method | URL | Who | What |
|---|---|---|---|
| GET | `/api/notifications` | Logged in | Get my notifications |
| PUT | `/api/notifications/read-all` | Logged in | Mark all as read |
| PUT | `/api/notifications/:id/read` | Logged in | Mark one as read |

### Admin — `/api/admin`

| Method | URL | Who | What |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users` | Admin | Create a user directly |
| PUT | `/api/admin/users/:id/role` | Admin | Change user role |
| GET | `/api/admin/audit-logs` | Admin | View audit trail |

---

## How Cookies Work

We use HTTP-only cookies for JWT tokens.

- The browser stores them automatically
- JavaScript in the browser **cannot** read HTTP-only cookies
- This protects against XSS attacks

Two cookies are used:

| Cookie | Lifetime | Purpose |
|---|---|---|
| `token` | 15 minutes | Access token — sent with every request |
| `refreshToken` | 2–8 hours | Refresh token — used to renew the access token |

---

## How Authentication Works

1. User sends email and password to `POST /api/users/login`
2. Server finds the user in the database and checks the password
3. If correct, server creates two JWT tokens
4. Tokens are stored in HTTP-only cookies in the browser
5. Browser sends cookies automatically with every API request
6. Server reads the cookie and verifies the token on each request
7. When the access token expires the frontend calls `/refresh-token` automatically
8. When the user logs out, both cookies are cleared

---

## How Roles Work

There are three roles in the system:

| Role | What They Can Do |
|---|---|
| `admin` | Everything — manage all users, view audit logs |
| `manager` | Create shifts, manage their employees, approve requests |
| `employee` | View shifts, apply for shifts, submit requests, check in/out |

Every protected route checks:
1. Is the user logged in? (`isLoggedIn` middleware)
2. Does the user have the right role? (`checkRole` middleware)
