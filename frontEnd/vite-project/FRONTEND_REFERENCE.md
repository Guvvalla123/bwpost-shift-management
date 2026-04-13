# BWPost Shift Management — Frontend Reference
*Generated: April 6, 2026*  
*Stack: React 19 + Vite 7 + React Router 7 + Tailwind CSS 3*  
*Author: BWPost Development Team*

---

## 1. Project Overview

The Vite + React SPA is the **BWPost Shift Management** web client. It talks to the Express API using **Axios** with **`withCredentials: true`** so HTTP-only auth cookies work. Routes are split by role under `/admin/*`, `/manager/*`, and `/employee/*`, with **lazy-loaded** page chunks and **React Router 7** nested layouts. UI uses **Tailwind CSS** with BWPost brand tokens (`bwpost.*` in `tailwind.config.js`) and **sonner** for toasts.

---

## 2. Tech Stack & Dependencies

| Package | Version | Purpose | Where used |
|---------|---------|---------|------------|
| react / react-dom | ^19.2.0 | UI | App, pages, components |
| react-router-dom | ^7.9.6 | Routing, `Navigate`, `Outlet` | `App.jsx`, layouts, `ProtectedRoute` |
| vite | ^7.2.4 | Dev server & build | `vite.config.js` |
| @vitejs/plugin-react | ^5.1.4 | React refresh in Vite | Vite config |
| axios | ^1.13.2 | HTTP client | `api.js`, pages |
| tailwindcss | ^3.4.18 | Utility CSS | `tailwind.config.js`, `index.css` |
| tailwindcss-animate | ^1.0.7 | Animation utilities | Tailwind plugins |
| autoprefixer / postcss | — | CSS pipeline | PostCSS |
| lucide-react | ^0.555.0 | Icons | Pages & components |
| sonner | ^2.0.7 | Toasts | `App.jsx` `<Sonner />`, auth/pages |
| clsx / tailwind-merge | — | `cn()` helper | `lib/utils.js` |
| @fullcalendar/* | ^6.1.20 | Calendar views | `Calender.jsx` |
| @react-oauth/google | ^0.13.4 | Google OAuth wrapper | `main.jsx`, calendar |
| recharts | ^3.7.0 | Charts | `Reports.jsx` |
| eslint + plugins | — | Lint | `eslint.config.js` |

---

## 3. Project Structure (`src/`)

```
src/
├── main.jsx                 # Root: StrictMode, GoogleOAuthProvider, Router, AuthProvider, ErrorBoundary
├── App.jsx                  # Routes, lazy imports, Suspense, Sonner
├── index.css                # Tailwind layers + scrollbar/selection/focus styles
├── calender.css             # FullCalendar overrides (imported from Calender.jsx)
├── api.js                   # Axios instance + 401 refresh queue
├── App.jsx                  # (see above)
├── context/
│   ├── AuthContext.jsx      # user state, checkAuth, login, logout, updateUser
│   └── useAuth.js           # Hook consuming AuthContext
├── components/
│   ├── ProtectedRoute.jsx   # ProtectedRoute + PublicRoute
│   ├── ErrorBoundary.jsx    # Class boundary → reload UI
│   ├── DateTimePicker.jsx   # Date/time popover for shift forms
│   ├── layout/
│   │   ├── Header.jsx       # Marketing header + mobile nav
│   │   └── Footer.jsx       # Site footer
│   └── ui/
│       ├── index.js         # Re-exports Pagination, Skeleton*, EmptyState, ErrorState
│       ├── Pagination.jsx   # Page controls + mobile Prev/Next
│       ├── Skeleton.jsx     # Loading placeholders
│       ├── EmptyState.jsx   # Empty list placeholder
│       └── ErrorState.jsx   # Retry-capable error block
├── hooks/
│   └── useDebounce.js       # Debounced value (search/filters)
├── lib/
│   └── utils.js             # cn() = clsx + tailwind-merge
├── utils/
│   ├── apiError.js          # unwrapSuccessData, getApiErrorMessage, getApiFieldErrors
│   ├── displayName.js       # Display helpers
│   └── shiftStatus.js       # Shift status helpers for UI
└── pages/
    ├── auth/                # Login, Register, ForgotPassword
    ├── layout/              # Home, AdminLayout, ManagerLayout, EmployeeLayout, sidebars
    ├── admin/               # Admin dashboard, users, managers, invites + ManagerManagement/*
    ├── manager/             # Dashboard, shifts, employees, requests, calendar, attendance, reports, settings
    └── Employee/            # Employee dashboard, check-in, shifts, my shifts, requests, profile
```

**Additional page-local components:** `ManagerRow.jsx`, `ManagerTable.jsx`, `ShiftRow.jsx`, `ShiftTable.jsx`, `EmployeeTable.jsx`, `CreateShiftModal.jsx`, `EditShiftModal.jsx` under their parent folders.

---

## 4. Environment Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `VITE_API_URL` | Recommended | Axios `baseURL` | `http://localhost:5500` |
| `VITE_GOOGLE_CLIENT_ID` | Optional | `GoogleOAuthProvider` + calendar OAuth | `.env.example` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Optional | Direct upload to Cloudinary | Settings / EmployeeProfile |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Optional | Unsigned preset name | Same |

If `VITE_API_URL` is unset, `api.js` defaults to `http://localhost:5500`. In production, `main.jsx` warns if `VITE_GOOGLE_CLIENT_ID` is missing.

---

## 5. How To Run

```bash
cd frontEnd/vite-project
npm install
npm run dev      # Vite dev server (default http://localhost:5173)
npm run build    # Production bundle → dist/
npm run preview  # Preview production build
npm run lint     # ESLint
```

---

## 6. Design System — BWPost Brand

### Colors (from `tailwind.config.js` + common literals)

| Name | Hex / token | Used for |
|------|-------------|----------|
| bwpost.sidebar | `#0f2042` | Sidebar backgrounds |
| bwpost.navy | `#1B3F8B` | Primary buttons, headings, brand |
| bwpost.accent | `#2563EB` | Accents |
| bwpost.light | `#93C5FD` | Highlights |
| bwpost.tint | `#EFF6FF` | Soft panels |
| bwpost.border | `#e2e8f0` | Borders |
| Slate scale | Tailwind `slate-*` | Body text, muted UI |
| CSS variables | `--background`, `--foreground`, `--border`, `--input`, `--ring` | Base layer in `index.css` |

### Typography (patterns)

| Element | Typical classes | Usage |
|---------|-----------------|-------|
| Page title | `text-2xl font-bold text-slate-900` | Dashboards, settings |
| Body | `text-sm text-slate-600` | Tables, forms |
| Brand wordmark | `text-[#1B3F8B]` + light “POST” | Home, headers |
| Inputs | `border-slate-200 focus:border-[#1B3F8B] focus:ring-[#BFDBFE]/50` | Forms across auth and admin |

### Key components

| Component | File | Props (summary) | Usage |
|-----------|------|-----------------|-------|
| Pagination | `components/ui/Pagination.jsx` | `currentPage`, `totalPages`, `totalItems`, `pageSize`, `onPageChange`, `isLoading` | Lists with server pagination |
| ErrorState | `components/ui/ErrorState.jsx` | `title`, `message`, `onRetry` | Failed fetches |
| EmptyState | `components/ui/EmptyState.jsx` | (varies) | Empty tables |
| Skeleton* | `components/ui/Skeleton.jsx` | — | Loading rows/cards |
| DateTimePicker | `components/DateTimePicker.jsx` | `value`, `onChange`, `placeholder`, `accentColor` | Shift create/edit modals |
| ProtectedRoute | `components/ProtectedRoute.jsx` | `requiredRole` or `requiredRoles` | Route guards |
| PublicRoute | same file | `children` | Redirect logged-in users from login/home |
| Header / Footer | `components/layout/*` | — | Register + marketing pages |

---

## 7. Application Routes

| Path | Component | Auth | Role | Description |
|------|-----------|------|------|-------------|
| `/` | Home | PublicRoute | — | Landing |
| `/login` | Login | PublicRoute | — | Sign in |
| `/register` | Register | PublicRoute | — | Invite or blocked public signup |
| `/forgot-password` | ForgotPassword | None | — | Static “contact HR” placeholder |
| `/admin` | AdminLayout | ProtectedRoute | admin | Redirect index → `dashboard` |
| `/admin/dashboard` | AdminDashboard | admin | admin | KPIs |
| `/admin/users` | AdminUserManagement | admin | admin | Users + invites |
| `/admin/managers` | AdminManagerManagement | admin | admin | Managers |
| `/admin/invites` | AdminInviteManagement | admin | admin | Invites |
| `/admin/employees` | Employee | admin | admin | Employee CRUD (shared page) |
| `/admin/calendar` | Calender | admin | admin | Calendar |
| `/admin/attendance` | AttendanceManagement | admin | admin | Attendance |
| `/admin/reports` | Reports | admin | admin | Reports |
| `/admin/settings` | Settings | admin | admin | Profile |
| `/manager` | ManagerLayout | ProtectedRoute | manager | Index → `dashboard` |
| `/manager/dashboard` | Dashboard | manager | manager | Manager home |
| `/manager/shifts` | ManagerShifts | manager | manager | CRUD shifts |
| `/manager/employees` | Employee | manager | manager | Team |
| `/manager/shiftrequests` | ShiftRequest | manager | manager | Approve/reject |
| `/manager/calender` | Calender | manager | manager | Note spelling `calender` |
| `/manager/attendance` | AttendanceManagement | manager | manager | |
| `/manager/reports` | Reports | manager | manager | |
| `/manager/settings` | Settings | manager | manager | |
| `/employee` | EmployeeLayout | ProtectedRoute | employee | Index = dashboard |
| `/employee/dashboard` | EmployeeDashboard | employee | employee | |
| `/employee/checkin` | EmployeeCheckIn | employee | employee | Clock in/out |
| `/employee/AllShifts` | EmployeeShifts | employee | employee | Browse/apply |
| `/employee/myshifts` | MyShifts | employee | employee | My shifts + requests |
| `/employee/requests` | MyRequests | employee | employee | Request history |
| `/employee/profile` | EmployeeProfile | employee | employee | Profile + image |
| `*` | Inline 404 | — | — | Unknown paths |

**Role route separation:** Wrong role → `Navigate` to that role’s dashboard (`ProtectedRoute.jsx`).

---

## 8. Authentication Flow (Frontend)

1. **`AuthProvider`** (`AuthContext.jsx`): On mount runs `checkAuth` → `GET /api/users/me`; on failure tries `POST /api/users/refresh-token` then `me` again; sets `user` or `null`. Exposes `user`, `loading`, `login`, `logout`, `updateUser`.
2. **`ProtectedRoute`:** While `loading`, shows spinner. If no `user`, `Navigate` to `/login`. If role mismatch, redirect to correct dashboard.
3. **Axios interceptor** (`api.js`): On `401`, skips for `/api/users/me` and `/refresh-token`. Otherwise queues requests, calls `POST /api/users/refresh-token`, replays queue; on failure dispatches `auth:logout` custom event.
4. **Retry:** `isRefreshing` + `failedQueue` prevent parallel refresh storms.
5. **Logout:** `logout()` clears state and best-effort `POST /api/users/logout`. `auth:logout` listener sets `user` null and `window.location.replace("/login")`.

---

## 9. API Integration

- **`api.js`:** `axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5500", withCredentials: true, timeout: 10000 })`.
- **`withCredentials: true`:** Required for cross-origin cookie auth (Vercel → Render).
- **401 handling:** Described above; refresh cookie must be valid.
- **Pagination:** Pages pass `page` & `limit` query strings; read `res.data.pagination` where API returns it.
- **Errors:** `getApiErrorMessage`, `unwrapSuccessData`, `getApiFieldErrors` align with backend `{ success, error, data.errors }`.

---

## 10. Pages — Complete Reference

### Home (`/`)
- **File:** `pages/layout/Home.jsx`  
- **Role:** Public  
- **Description:** Marketing landing with BWPost hero and feature sections.  
- **API:** None  
- **Features:** Smooth scroll nav, login CTA.

### Login (`/login`)
- **File:** `pages/auth/Login.jsx`  
- **Role:** Public (PublicRoute)  
- **API:** `POST /api/users/login`, `GET /api/users/me`  
- **State:** `formData`, `errors`, `loading`, `showPassword`  
- **Features:** Client-side validation, toast errors, role-based redirect after `login()`.

### Register (`/register`)
- **File:** `pages/auth/Register.jsx`  
- **Role:** Public  
- **API:** `GET /api/invites/validate/:token`, `POST /api/invites/accept` **or** `POST /api/users/register` (latter fails with 403 when no invite).  
- **State:** `formData`, `inviteValid`, `inviteRole`, `loading`, etc.  
- **Features:** Invite-prefilled email, password rules matching backend expectations.

### Forgot Password (`/forgot-password`)
- **File:** `pages/auth/ForgotPassword.jsx`  
- **Role:** Public  
- **API:** None (static copy only).

### AdminDashboard (`/admin/dashboard`)
- **File:** `pages/admin/AdminDashboard.jsx`  
- **Role:** Admin  
- **API:** `GET /api/manager/shifts/dashboard/data`  
- **Features:** Stats cards, `BannerTimeCard` (`React.memo`), recent shifts.

### AdminUserManagement (`/admin/users`)
- **API:** `GET /api/admin/users`, `PUT /api/admin/users/:id/role`, `POST /api/admin/users`, `POST /api/invites`  
- **Features:** Search, pagination, role modal, create user, send invite.

### AdminManagerManagement (`/admin/managers`)
- **API:** `GET /api/admin/users?role=manager`, `POST /api/admin/users`, `POST /api/invites`  
- **Features:** Manager table/drawer (`ManagerTable`, `ManagerRow`).

### AdminInviteManagement (`/admin/invites`)
- **API:** `GET /api/invites`, `GET /api/admin/users` (managers), `POST /api/invites`  
- **Features:** Filter invites, copy links, `useMemo` filtered list.

### Employee (`/admin/employees` & `/manager/employees`)
- **File:** `pages/manager/EmployeeManagement/Employee.jsx`  
- **API:** `GET/POST /api/manager/shifts/employees`, `GET .../employees/:id/attendance`, `PUT .../employees/:id`, `DELETE .../employees/:id`, `POST /api/invites`  
- **Features:** Add/edit/deactivate, invite link, attendance drawer, pagination.

### Calender (`/admin/calendar`, `/manager/calender`)
- **File:** `pages/manager/Calender.jsx`  
- **API:** `GET /api/manager/shifts`  
- **Features:** FullCalendar + optional Google OAuth for sync UI.

### AttendanceManagement (`/admin/attendance`, `/manager/attendance`)
- **File:** `pages/manager/Attendance/AttendanceManagement.jsx`  
- **API:** `GET /api/attendance/shift/:id`, attendance POSTs, `GET /api/manager/shifts/employees`, `GET /api/manager/shifts`  
- **Features:** Shift picker, per-employee check-in/out/break, timesheet tab with `useMemo` filters.

### Reports (`/admin/reports`, `/manager/reports`)
- **File:** `pages/manager/Reports.jsx`  
- **API:** `GET /api/manager/shifts`, `GET /api/manager/shifts/employees`  
- **Features:** `useMemo` summaries, Recharts, CSV export, `useCallback` fetch.

### Settings (`/admin/settings`, `/manager/settings`)
- **File:** `pages/manager/Settings.jsx`  
- **API:** `PUT /api/users/profile` (with Cloudinary upload if env set)  
- **Features:** Avatar + username.

### Manager Dashboard (`/manager/dashboard`)
- **File:** `pages/manager/Dashboard.jsx`  
- **API:** `GET /api/manager/shifts/dashboard/data`  
- **Features:** Same family as admin dashboard widgets.

### ManagerShifts (`/manager/shifts`)
- **File:** `pages/manager/shiftsfolder/ManagerShifts.jsx`  
- **API:** `GET/POST/PUT/DELETE /api/manager/shifts` (+ `/:id`)  
- **Features:** Filters, pagination, create/edit modals, delete confirm.

### ShiftRequest (`/manager/shiftrequests`)
- **File:** `pages/manager/shiftsfolder/ShiftRequest.jsx`  
- **API:** `GET /api/manager/requests`, `PUT /api/manager/requests/:id/approve|reject`  
- **Features:** Debounced search, date filters, `useMemo` visible rows, Pagination.

### EmployeeDashboard (`/employee`, `/employee/dashboard`)
- **File:** `pages/Employee/EmployeeDashboard.jsx`  
- **API:** `GET /api/employee/shifts/myshifts`, `GET /api/employee/shifts/requests`  
- **Features:** Upcoming shifts + requests summary, `BannerTimeCard` memo.

### EmployeeCheckIn (`/employee/checkin`)
- **File:** `pages/Employee/EmployeeCheckIn.jsx`  
- **API:** `GET /api/employee/shifts/myshifts`, `GET /api/attendance/my/:shiftId`, attendance POSTs  
- **Features:** `useMemo` timers/break state, shift selector.

### EmployeeShifts (`/employee/AllShifts`)
- **File:** `pages/Employee/EmployeeShifts.jsx`  
- **API:** `GET /api/employee/shifts/available-shifts`, `POST .../applyForShift`, `POST .../cancelShift`  
- **Features:** Apply/cancel with toasts.

### MyShifts (`/employee/myshifts`)
- **File:** `pages/Employee/MyShifts.jsx`  
- **API:** `GET` myshifts + available-shifts, `POST .../requests/leave`, `POST .../requests/shift-change`  
- **Features:** Dual lists, request modals.

### MyRequests (`/employee/requests`)
- **File:** `pages/Employee/MyRequests.jsx`  
- **API:** `GET /api/employee/shifts/requests`  
- **Features:** Filters, pagination, status badges.

### EmployeeProfile (`/employee/profile`)
- **File:** `pages/Employee/EmployeeProfile.jsx`  
- **API:** `PUT /api/users/profile`, Cloudinary upload  
- **Features:** Same profile pattern as Settings.

### Layouts & sidebars
- **AdminLayout / ManagerLayout / EmployeeLayout:** Shell, sidebar, logout (`POST /api/users/logout`), optional Cloudinary avatar URL normalization. **ManagerLayout** also fetches `GET /api/manager/shifts/dashboard/data` for notification-style header.

---

## 11. Shared Components

### Pagination
- **Props:** `currentPage`, `totalPages`, `totalItems`, `pageSize` (default 20), `onPageChange`, `isLoading`  
- **Usage:** Pass backend `pagination.page` / `pagination.totalPages` / `pagination.total`.

### ErrorState / EmptyState / Skeleton*
- Used across manager/admin/employee tables for UX consistency.

### DateTimePicker
- **Props:** `value` (ISO string), `onChange`, `placeholder`, `accentColor`  
- **Usage:** `CreateShiftModal`, `EditShiftModal`.

### Header / Footer
- **Header:** Marketing links, mobile menu, conditional dashboard button from `useAuth`.  
- **Footer:** Register page layout.

---

## 12. Context & State Management

- **`AuthContext`:** Holds `user` (`id`, `role`, `username`, `email`, `profileImage`), `loading`, `login`, `logout`, `updateUser`.  
- **`useAuth`:** `useContext(AuthContext)` — throws if used outside provider (see `useAuth.js`).  
- **Data flow:** `main.jsx` wraps app → layouts read `useAuth` for nav/avatar → pages call `login` after manual `me` fetch on login form.

---

## 13. Performance Optimizations

- **React.lazy:** All major routes in `App.jsx` (public pages, layouts, role dashboards, admin/manager/employee feature pages).  
- **React.memo:** `BannerTimeCard` in `AdminDashboard.jsx`, `Dashboard.jsx`, `EmployeeDashboard.jsx`.  
- **useMemo:** e.g. `Reports.jsx` (summary, chart, CSV), `ShiftRequest.jsx` / `MyRequests.jsx` (filtered lists), `AttendanceManagement.jsx` (filtered records), `EmployeeCheckIn.jsx` (derived times), `AdminInviteManagement.jsx` (filtered invites).  
- **useCallback:** Data fetchers and handlers in dashboards, calendars, employee admin, `AuthContext` (`fetchMe`, `checkAuth`).  
- **Code splitting:** Each `lazy(() => import(...))` becomes async chunks loaded on navigation.

---

## 14. Mobile Responsiveness

- **Breakpoints:** Tailwind defaults (`sm:`, `md:`, `lg:`) — e.g. `Pagination` stacks on small screens (`flex-col` / `sm:flex-row`), `Header` `md:flex` for desktop nav.  
- **Sidebars:** Layout components implement drawer/collapse patterns (see `AdminLayout`, `ManagerLayout`, `EmployeeLayout`, `*sidebar.jsx`).  
- **Tables:** Several pages switch to card-style or horizontal scroll on small widths (implemented per page in manager/employee UIs).  
- **Fully responsive goal:** Home, auth, dashboards, shifts, attendance — all use responsive Tailwind utilities; verify per release on real devices.

---

## 15. Error Handling (Frontend)

- **ErrorBoundary** (`components/ErrorBoundary.jsx`): Catches render errors; shows reload button; logs `componentDidCatch`.  
- **ErrorState:** Inline retry for data fetching failures.  
- **Sonner toasts:** Success/error feedback on mutations (`toast.success` / `toast.error` with `getApiErrorMessage`).  
- **Forms:** `Login`/`Register` inline field errors from API via `getApiFieldErrors` where applicable.

---

## 16. Pagination UI

- **`Pagination` component** expects server totals; parent holds `page` state and refetches with `?page=&limit=` (typically `limit=20` aligned with backend default).  
- **Mobile:** Prev/Next + “Page X of Y”; **Desktop:** numbered buttons with ellipses via `buildPageList`.

---

## 17. Role-Based UI

| Role | Sees |
|------|------|
| **Admin** | Full `/admin/*` tree: cross-tenant users, managers, invites, shared manager tools (calendar, attendance, reports), settings. |
| **Manager** | `/manager/*` — own employees and shifts, requests, attendance, reports. |
| **Employee** | `/employee/*` — apply to shifts, my shifts, check-in, requests, profile. |

---

## 18. Known Issues & Future Work

- **Forgot password page:** Informational only; no API call (backend reset exists but email not wired).  
- **Invite emails:** No SES integration on frontend/backend UX beyond copy-link.  
- **Dark mode:** `tailwind.config.js` has `darkMode: ["class"]` and some `dark:` classes in `Register.jsx` / `Header.jsx`; full dark theme not productized.  
- **Public register:** Backend rejects; UI still has branch calling `POST /api/users/register` when no invite — user sees error toast if used.  
- **Google Calendar:** Requires `VITE_GOOGLE_CLIENT_ID` in production (warning in `main.jsx`).

---

## 19. Deployment

- **Typical:** **Vercel** for static hosting (per project conventions).  
- **Build:** `npm run build`  
- **Output:** `dist/`  
- **Env on Vercel:** `VITE_API_URL` → production API URL (Render); optional Google and Cloudinary vars.

---

*End of frontend reference.*
