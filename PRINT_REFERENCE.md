# BWPost Shift Management — Print Reference
*Condensed printable overview — April 6, 2026*

---

## Page 1 — Project overview & architecture

**What it is:** Internal shift scheduling and attendance system for BWPost: managers create shifts, employees apply or are assigned, attendance is tracked per shift, and leave/shift-change requests flow to managers (and admins have full visibility).

**Backend stack:** Node.js, Express, Mongoose, MongoDB. **Frontend stack:** React 19, Vite 7, React Router 7, Tailwind CSS 3, Axios, sonner.

**Request flow (backend):**  
`HTTP` → Express middleware (security, CORS, parse, sanitize) → **Routes** → `validate` (Joi) + `auth` / `authorize` → **Controllers** → **Services** (rules, audit, pagination) → **Models** → MongoDB.

**Request flow (frontend):**  
`Browser` → React Router → `ProtectedRoute` / `PublicRoute` → lazy-loaded **Pages** → `API` (Axios + credentials) → backend cookies + JSON.

**Trust & sessions:** Access JWT in `token` cookie (~15m); refresh in `refreshToken` cookie (~7d). Frontend axios interceptor refreshes on 401 (except `/me` and refresh endpoints).

---

## Page 2 — Database models (six)

| Model | Collection | Purpose |
|-------|------------|---------|
| User | `users` | Accounts; roles; `managerId` for employees; soft delete `isActive` |
| Shift | `shifts` | Shift window, slots, `acceptedEmployees`, owning `createdByManager` |
| Attendance | `attendances` | Unique per `(shift, employee)`; status; work sessions; breaks; totals |
| ShiftRequest | `shiftrequests` | `leave` or `shift_change`; `pending`/`approved`/`rejected` |
| Invite | `invites` | 64-hex token; email; role; optional `managerId`; `expiresAt`; `usedAt` |
| AuditLog | `auditlogs` | Who did what (`action`, `actorId`, `targetType`, `details`, IP, UA) |

**Critical rules:** Employee users must have `managerId`. Shift end > start. Passwords hashed with bcrypt cost **12**. Approve/reject requests use **MongoDB transactions** in `shiftRequestService.js`.

---

## Page 3 — All API endpoints (compact)

- Users: `registration-status`, `register` (403), `login`, `logout`, `refresh-token`, `me`, `profile`, `forgot-password`, `reset-password/validate/:token`, `reset-password`
- Admin: `GET/POST /api/admin/users`, `PUT /api/admin/users/:userId/role`
- Invites: `GET/POST /api/invites`, `GET validate/:token`, `POST accept`
- Manager shifts: `GET public`, `POST/GET /`, `GET dashboard/data`, CRUD `/:shiftId`, employees CRUD under `/employees`, `.../attendance`, `shift-accepted-employees/:shiftId`, `shift/assign-employee`, `shift/remove-employee`
- Employee shifts: `available-shifts`, `myshifts`, `applyForShift`, `cancelShift`, `requests/leave`, `requests/shift-change`, `requests`
- Manager requests: `GET /`, `PUT /:id/approve`, `PUT /:id/reject`
- Attendance: `checkin`, `checkout`, `break/start`, `break/end`, `my/:shiftId`, `shift/:shiftId`
- Misc: `GET /`, `GET /health`

---

## Page 4 — Frontend routes & page map

- **Public:** `/`, `/login`, `/register`, `/forgot-password`
- **Admin:** `/admin/dashboard`, `users`, `managers`, `invites`, `employees`, `calendar`, `attendance`, `reports`, `settings`
- **Manager:** `/manager/dashboard`, `shifts`, `employees`, `shiftrequests`, `calender`, `attendance`, `reports`, `settings`
- **Employee:** `/employee` (dashboard), `checkin`, `AllShifts`, `myshifts`, `requests`, `profile`
- **404:** `*` unknown path

---

## Page 5 — Authentication (both sides)

**Backend:** `userService.login` verifies password, stores refresh token on user, sets cookies via `getCookieOptions`. `authMiddleware` verifies access JWT from cookie. Refresh rotates both tokens. Logout clears DB refresh + cookies.

**Frontend:** `AuthProvider` loads `/me`, falls back to refresh + `/me`. `ProtectedRoute` blocks guests and wrong roles. Axios queue retries once after successful `POST /refresh-token`; failure dispatches `auth:logout` → redirect login. `logout()` clears React state and calls `POST /logout`.

---

## Page 6 — Development setup & credentials

1. Clone repo, `npm install` in `backEnd` and `frontEnd/vite-project`.
2. Copy `.env.example` → `.env` in both places; set `MONGO_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` on backend; `VITE_API_URL` on frontend.
3. `npm run seed:admin` then `npm run seed:dev` (optional).
4. `npm run dev` in each folder.

**Logins:** Admin `admin@bwpost.com` / `Admin@123!` (dev default). Manager `manager@bwpost.de` / `Manager@123!`. Employee `employee@bwpost.de` / `Employee@123!`.

**Clean slate:** `node backEnd/scripts/cleanDatabase.js` (keeps admin + seed dev emails; wipes shifts, attendance, requests, invites, audit).

---

## Page 7 — Glossary

| Term | Meaning |
|------|---------|
| **JWT (JSON Web Token)** | Signed string proving identity; here access token includes `id` and `role`, stored in an HTTP-only cookie. |
| **Refresh token** | Longer-lived token used only to obtain new access tokens without re-entering password. |
| **Middleware** | Express functions that run before the route handler (auth, validation, rate limits). |
| **Mongoose** | Library that maps JavaScript objects to MongoDB documents with schemas and hooks. |
| **MongoDB** | Document database storing users, shifts, attendance, etc. |
| **Replica set** | MongoDB deployment type required for multi-document **transactions** (used when approving/rejecting shift requests). |
| **bcrypt** | Slow hashing function for passwords so stolen hashes are costly to crack. |
| **CORS** | Browser security that blocks cross-origin requests unless the server explicitly allows the frontend origin. |
| **Helmet** | Middleware that sets HTTP headers to reduce common web vulnerabilities. |
| **Joi** | Schema library validating request bodies and queries before controllers run. |
| **HTTP-only cookie** | Cookie not readable by JavaScript—reduces XSS token theft. |
| **SameSite** | Cookie attribute controlling whether cookies are sent on cross-site requests (`lax` dev, `none`+`secure` prod here). |
| **Axios** | Promise-based HTTP client used by the React app. |
| **Vite** | Fast frontend build tool and dev server for this project. |
| **React Router** | Declarative client-side routing (`Routes`, `Route`, `Navigate`, `Outlet`). |
| **Lazy loading** | Loading page JS only when the user navigates to that route (`React.lazy`). |
| **Context API** | React mechanism holding authenticated `user` for the whole tree (`AuthProvider`). |
| **Tailwind CSS** | Utility-first CSS framework composing classes in JSX. |
| **Soft delete** | Marking `isActive: false` instead of removing user rows—preserves history. |
| **Audit log** | Append-only records of sensitive actions for accountability. |
| **Rate limiting** | Restricting how many requests an IP can make in a time window to slow abuse. |
| **Pagination** | Returning one page of results (`page`, `limit`, `skip`) plus metadata (`total`, `totalPages`). |
| **Shift request** | Employee ask to leave a shift (`leave`) or move to another (`shift_change`). |
| **Invite flow** | Admin/manager generates tokenized link; user completes signup at `/register?invite=...`. |
| **Render** | Typical PaaS host for the Node API (reverse proxy → `trust proxy`). |
| **Vercel** | Typical static host for the Vite `dist/` build. |
| **Cloudinary** | Image CDN/upload target for profile photos when env vars are set. |
| **Sonner** | Toast notification library for quick user feedback. |
| **FullCalendar** | Calendar UI used in the manager/admin calendar page. |
| **Recharts** | Charting library used on the reports page. |
| **AppError** | Custom error class carrying HTTP status and optional validation `data`. |
| **asyncHandler** | Wrapper so async controller errors reach Express error middleware. |
| **express-mongo-sanitize** | Removes keys that look like Mongo operators from user input. |
| **XSS** | Cross-site scripting; mitigated here by sanitizing serialized query/body/params. |
| **Trust proxy** | Tells Express to honor `X-Forwarded-*` headers when behind a load balancer. |
| **HTTP 401 / 403** | 401 = not authenticated; 403 = authenticated but not allowed. |

---

*End of print reference.*
