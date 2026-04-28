# BWPost Shift Management — Frontend

## What This Is

This is the **React** web app for BWPost workforce management.

**Managers** plan shifts, watch attendance, and handle requests. **Employees** see open shifts, check in and out, and submit leave or shift-change requests. **Admins** manage users, invites, and audit history.

The UI talks to the Express API over HTTPS in production and to `http://localhost:5500` (or your `.env`) in development.

---

## Tech Stack

| Package | Role |
|---------|------|
| **React 19** | UI library |
| **Vite 7** | Dev server and production build |
| **Tailwind CSS 3** | Utility-first styling |
| **React Router v7** (`react-router-dom`) | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Recharts** | Charts and KPI visuals |
| **FullCalendar** (`@fullcalendar/*`) | Calendar views |
| **Lucide React** | Icon set |
| **Sonner** | Toast notifications |

---

## Folder Structure

Paths are under `frontEnd/vite-project/src/`.

```
src/
  App.jsx                 — Route table; layouts; protected routes
  main.jsx                — React root mount
  api.js                  — Shared Axios instance (base URL, credentials, refresh)
  context/
    AuthContext.jsx       — Logged-in user + auth helpers for the whole tree
  hooks/
    useAutoRefresh.js     — Periodic + visibility refresh hooks
    useSidebarCollapsed.js— Persists sidebar open/closed (e.g. localStorage)
  components/
    ui/                   — Reusable primitives
      Button.jsx          — Variants (primary, outline, etc.)
      Input.jsx           — Labeled inputs
      Badge.jsx           — Status colors
      Modal.jsx           — Dialog; mobile-friendly behavior
      DonutChart.jsx      — Donut chart (Recharts)
      KpiCard.jsx         — Stat + icon card
      BottomNav.jsx       — Mobile bottom navigation
      EmptyState.jsx      — Empty list placeholder
      ErrorState.jsx      — Error + retry
      Skeleton.jsx        — Loading placeholders
      Pagination.jsx      — Page controls
      MobileRefreshButton.jsx — Manual refresh on small screens
    layout/
      NotificationBell.jsx — Bell + unread badge
      Header.jsx            — Top bar
      Footer.jsx            — Footer when used
    security/
      ActiveSessionsSection.jsx — Session list / revoke (where wired)
    ProtectedRoute.jsx    — Role-based route guard
    ErrorBoundary.jsx     — Catches render errors
    DateTimePicker.jsx    — Shared date/time control
  pages/
    auth/
      Login.jsx           — Sign in
      Register.jsx        — Invite-based registration
      ForgotPassword.jsx  — Request reset link
      ResetPassword.jsx   — Complete reset
    layout/
      ManagerLayout.jsx   — Shell for manager area
      EmployeeLayout.jsx  — Shell for employee area
      AdminLayout.jsx     — Shell for admin area
      Managersidebar.jsx  — Manager nav
      Employeesidebar.jsx — Employee nav
      Home.jsx            — Landing / marketing
    manager/
      dashboard/          — Manager home + stats
      shifts/             — Shift list, filters, details, CSV-related UI
      Attendance/         — Attendance overview (note folder name casing)
      employees/          — Team management
      requests/           — Approve / reject requests
      reports/            — Analytics pages
      settings/           — Profile, sessions, photo
      Calender.jsx        — Calendar page (spelling as in repo)
      …                   — Other manager utilities (e.g. Dashboard.jsx, shiftsfolder/)
    Employee/             — Employee area (capital E — Windows paths)
      dashboard/
      checkin/            — Check-in / check-out / weekly hours
      myshifts/
      myrequests/
      profile/
      EmployeeShifts.jsx  — Browse / apply open shifts
      …                   — Legacy or shared files (MyShifts.jsx, etc.)
    admin/
      AdminDashboard.jsx
      dashboard/          — If present alongside root admin files
      users/              — User management
      managers/           — Manager management
      invites/
      ManagerManagement/
      AdminAuditLog.jsx
      AdminUserManagement.jsx
```

The exact mix of “page folder + root file” evolves as features grow; **`App.jsx`** is the source of truth for which component loads on each path.

---

## How Pages Are Organized

Large screens are split into **small files**:

**Example — manager shifts (`pages/manager/shifts/`):**

- `ShiftsPage.jsx` — State, data loading, composition
- `shiftApi.js` — All shift HTTP calls
- `ShiftStats.jsx`, `ShiftFilters.jsx` — Top of page
- `ShiftCard.jsx`, `ShiftTableRow.jsx` — Mobile vs desktop rows
- `ShiftDetails.jsx` — Panel or drawer for one shift
- `ShiftDeleteConfirm.jsx` — Confirm delete

Same idea on **reports**, **employees**, **Employee** areas: one `*Api.js` per feature and several focused components.

---

## How Routing Works

- **`App.jsx`** defines routes: public (login, register, password flows) vs layouts (`ManagerLayout`, `EmployeeLayout`, `AdminLayout`).
- **`ProtectedRoute`** (or equivalent) checks **role** before rendering a page.
- Nested routes keep URLs readable (`/manager/shifts`, `/employee/checkin`, etc.).

---

## How Authentication Works

- **`AuthContext`** holds the current user and exposes login/logout/update helpers.
- On load, the app typically calls **`GET /api/users/me`** with **`withCredentials: true`** so cookies are sent.
- JWTs live in **HTTP-only cookies** — frontend code does **not** read token strings from `document.cookie`.
- **Axios** (`api.js`) intercepts **401** responses, calls **`/api/users/refresh-token`**, retries the request, or redirects to login if refresh fails.

---

## How Auto Refresh Works

**`useAutoRefresh.js`** is used on data-heavy pages to:

- Refetch on an interval (for example **~60 seconds**).
- Refetch when the user **returns to the tab** (Page Visibility API).

That keeps lists and statuses fresh without full page reloads.

---

## Shared Components (short)

| File | Use |
|------|-----|
| `Button.jsx` | Prefer over raw `<button>` for consistent styles |
| `Input.jsx` | Labeled fields with validation display |
| `Badge.jsx` | Status labels with color |
| `Modal.jsx` | Overlays; tuned for mobile |
| `DonutChart.jsx` | Donut charts for proportions |
| `KpiCard.jsx` | Single number + label + icon |
| `EmptyState.jsx` | Friendly empty list |
| `ErrorState.jsx` | Error message + retry action |
| `Skeleton.jsx` | Loading skeletons |
| `Pagination.jsx` | Page number controls |
| `MobileRefreshButton.jsx` | Explicit refresh on phones |

---

## How To Run Locally

```bash
cd frontEnd/vite-project
npm install
npm run dev
```

Open **http://localhost:5173** (Vite prints the exact URL; next free port if 5173 is taken).

---

## Environment Variables

| Variable | Meaning |
|----------|---------|
| `VITE_API_URL` | Base URL for the backend API |

**Development:** often `http://localhost:5500`  
**Production:** your hosted API, e.g. `https://bwpost-shift-management-backend.onrender.com`

Create `.env` or `.env.local` in `vite-project/` (only variables prefixed with `VITE_` are exposed to the client).

---

*See also `FRONTEND_REFERENCE.md` in this folder for deeper file-by-file notes.*
