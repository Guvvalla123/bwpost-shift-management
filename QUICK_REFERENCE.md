# BWPost — Quick Reference Sheet

## Run The Project

```bash
cd backEnd && npm install && npm run dev
cd frontEnd/vite-project && npm install && npm run dev
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bwpost.com` | `Admin@123!` (dev default from `seedAdmin.js` unless env overrides) |
| Manager | `manager@bwpost.de` | `Manager@123!` |
| Employee | `employee@bwpost.de` | `Employee@123!` |

## Key URLs (Development)

| What | URL |
|------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5500 |
| Health | http://localhost:5500/health |
| API root message | http://localhost:5500/ |

## Database Scripts

| Action | Command |
|--------|---------|
| Seed admin | `cd backEnd && npm run seed:admin` |
| Seed manager + employee | `cd backEnd && npm run seed:dev` |
| Clean DB (no npm script) | `cd backEnd && node scripts/cleanDatabase.js` |

## All API Endpoints (one line each)

- `GET /` → JSON “Backend is running”
- `GET /health` → health + DB state (optional `x-health-token` if `HEALTH_CHECK_SECRET` set)
- `GET /api/users/registration-status` → `{ publicRegistrationEnabled: false }`
- `POST /api/users/register` → 403 public registration disabled
- `POST /api/users/login` → login + cookies
- `POST /api/users/logout` → clear session cookies + refresh in DB
- `POST /api/users/refresh-token` → rotate JWT cookies
- `GET /api/users/me` → current user
- `PUT /api/users/profile` → update username / profileImage
- `POST /api/users/forgot-password` → request reset (email not sent yet)
- `GET /api/users/reset-password/validate/:token` → validate reset token
- `POST /api/users/reset-password` → complete reset
- `GET /api/admin/users` → list users (admin)
- `POST /api/admin/users` → create user (admin)
- `PUT /api/admin/users/:userId/role` → change role (admin)
- `GET /api/invites/validate/:token` → validate invite
- `POST /api/invites/accept` → register via invite
- `GET /api/invites` → list invites (admin/manager)
- `POST /api/invites` → create invite (admin/manager)
- `GET /api/manager/shifts/public` → paginated upcoming shifts with slots (auth any)
- `POST /api/manager/shifts` → create shift (admin/manager)
- `GET /api/manager/shifts` → list shifts (admin/manager)
- `GET /api/manager/shifts/dashboard/data` → dashboard aggregates (admin/manager)
- `POST /api/manager/shifts/employees` → create employee (admin/manager)
- `GET /api/manager/shifts/employees` → list employees (admin/manager)
- `GET /api/manager/shifts/employees/:employeeId` → employee detail
- `PUT /api/manager/shifts/employees/:employeeId` → update employee
- `DELETE /api/manager/shifts/employees/:employeeId` → deactivate employee
- `GET /api/manager/shifts/employees/:employeeId/attendance` → attendance history
- `GET /api/manager/shifts/shift-accepted-employees/:shiftId` → accepted list
- `POST /api/manager/shifts/shift/assign-employee` → assign employee to shift
- `POST /api/manager/shifts/shift/remove-employee` → remove employee from shift
- `GET /api/manager/shifts/:shiftId` → shift by id
- `PUT /api/manager/shifts/:shiftId` → update shift
- `DELETE /api/manager/shifts/:shiftId` → delete shift
- `GET /api/employee/shifts/available-shifts` → shifts employee can apply to
- `GET /api/employee/shifts/myshifts` → employee’s accepted shifts
- `POST /api/employee/shifts/applyForShift` → self-apply
- `POST /api/employee/shifts/cancelShift` → cancel application
- `POST /api/employee/shifts/requests/leave` → leave request
- `POST /api/employee/shifts/requests/shift-change` → shift-change request
- `GET /api/employee/shifts/requests` → my requests
- `GET /api/manager/requests` → manager/admin request inbox
- `PUT /api/manager/requests/:id/approve` → approve request
- `PUT /api/manager/requests/:id/reject` → reject request
- `POST /api/attendance/checkin` → check in
- `POST /api/attendance/checkout` → check out
- `POST /api/attendance/break/start` → start break
- `POST /api/attendance/break/end` → end break
- `GET /api/attendance/my/:shiftId` → my attendance for shift
- `GET /api/attendance/shift/:shiftId` → full shift attendance (admin/manager)

## Frontend Routes (one line each)

- `/` → Home → public (guest; logged-in redirected by PublicRoute)
- `/login` → Login → public
- `/register` → Register → public
- `/forgot-password` → ForgotPassword → public
- `/admin` → AdminLayout → admin
- `/admin/dashboard` → AdminDashboard → admin
- `/admin/users` → AdminUserManagement → admin
- `/admin/managers` → AdminManagerManagement → admin
- `/admin/invites` → AdminInviteManagement → admin
- `/admin/employees` → Employee → admin
- `/admin/calendar` → Calender → admin
- `/admin/attendance` → AttendanceManagement → admin
- `/admin/reports` → Reports → admin
- `/admin/settings` → Settings → admin
- `/manager` → ManagerLayout → manager
- `/manager/dashboard` → Dashboard → manager
- `/manager/shifts` → ManagerShifts → manager
- `/manager/employees` → Employee → manager
- `/manager/shiftrequests` → ShiftRequest → manager
- `/manager/calender` → Calender → manager
- `/manager/attendance` → AttendanceManagement → manager
- `/manager/reports` → Reports → manager
- `/manager/settings` → Settings → manager
- `/employee` → EmployeeLayout (index = dashboard) → employee
- `/employee/dashboard` → EmployeeDashboard → employee
- `/employee/checkin` → EmployeeCheckIn → employee
- `/employee/AllShifts` → EmployeeShifts → employee
- `/employee/myshifts` → MyShifts → employee
- `/employee/requests` → MyRequests → employee
- `/employee/profile` → EmployeeProfile → employee
- `*` → 404 page → anyone

## Common Issues & Fixes

1. **EADDRINUSE port 5500** — Stop the other process or set `PORT` in `backEnd/.env`; on Windows: `netstat -ano | findstr :5500` then end task, or use `npx kill-port 5500`.
2. **401 on every API call from Vite** — Set `VITE_API_URL` to the backend origin; ensure backend `ALLOWED_ORIGINS` includes `http://localhost:5173`; use HTTPS + `sameSite=None` only in production with `secure` cookies.
3. **CORS error with credentials** — Backend must list exact frontend origin in `ALLOWED_ORIGINS`; trailing slashes matter if mismatched.
4. **Employee “not assigned to manager”** — Run `npm run seed:dev` or create employee with `managerId` / use manager invite flow.
5. **Mongo connection fails** — Check `MONGO_URI`, Atlas IP allowlist (`0.0.0.0/0` for dev), and TLS options in connection string.
6. **Invite link 404/invalid** — Token expires after 7 days; ensure `FRONTEND_URL` matches the site you open.
7. **Transactions error on approve/reject** — Use MongoDB replica set (e.g. Atlas); standalone local Mongo may reject multi-doc transactions.
8. **Missing JWT env** — Backend exits on boot if `JWT_SECRET` or `REFRESH_TOKEN_SECRET` or `MONGO_URI` missing.
9. **Health check 401 in production** — Set `x-health-token` header to match `HEALTH_CHECK_SECRET`, or unset secret for open health.
10. **Vite env not applied** — Restart dev server after changing `.env`; only `VITE_*` vars are exposed to the client.

---

*For full detail see `backEnd/BACKEND_REFERENCE.md` and `frontEnd/vite-project/FRONTEND_REFERENCE.md`.*
