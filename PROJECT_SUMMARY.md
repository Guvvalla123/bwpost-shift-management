# BWPost Project Summary

Complete overview of what this repository contains and how far along it is.

---

## Project Overview

| Field | Value |
|--------|--------|
| Name | BWPost Shift Management System |
| Purpose | Workforce scheduling and attendance for BWPost Germany |
| Scale target | 2200+ delivery workers |
| Status | Demo-ready; iterate for production hardening |

---

## Completion Status (indicative)

Percentages are **rough** self-assessments for planning — not formal QA metrics.

| Area | Approx. |
|------|--------:|
| Backend API | 80% |
| Frontend UI | 85% |
| Security | 82% |
| Mobile responsive | 80% |
| Feature breadth | 83% |
| **Overall** | **~78%** |

---

## What Was Built

### Backend (Node.js + Express + MongoDB)

- **7** Mongoose models: User, Shift, Attendance, ShiftRequest, Invite, Notification, AuditLog  
- **9** controller modules covering auth, shifts, attendance, employees, requests, invites, notifications, admin, dashboard-related logic  
- **8** route files under `/api/...` mounts  
- **4** middleware modules (auth, roles, validation, errors) plus rate limiters where applied  
- **11** helper modules (tokens, responses, audit, pagination, hours, CSV, errors, async, URLs, security log, hashing)  
- **7** Joi validation schema files  
- **2** cron modules (auto checkout + job registration)  
- **3+** scripts: seed admin, seed dev data, database backup  
- **40+** documented REST endpoints (more with optional query params and extra manager shift routes)

### Frontend (React + Vite + Tailwind)

- **30+** page-level areas, often split into **Api** modules and many small components  
- Shared **UI** library (buttons, inputs, modals, charts, empty/error states, pagination)  
- **Role-based** routing and guards  
- Layouts for **manager**, **employee**, and **admin**  
- Responsive behavior for common breakpoints  
- **Auto refresh** hook used across data-heavy views

---

## Key Features Implemented

### Authentication

- JWT **access** + **refresh** in **HTTP-only cookies**  
- Configurable lifetimes via environment variables  
- Refresh flow integrated with Axios  
- Session listing / revoke flows where wired in UI  
- Idle timeout behavior on the client as implemented

### Shift management

- Full shift CRUD for managers/admins  
- Employee apply / cancel flows  
- Slot and assignment-related endpoints  
- Dashboard aggregates and CSV export path  
- Calendar UI on the frontend

### Attendance

- Check-in, check-out, break start/end  
- Weekly hours endpoint  
- Per-shift attendance for employee and manager views  
- **Auto checkout** cron for forgotten clock-outs  

### Smart notifications

- In-app notification list + read states  
- When creating shifts, notifications can respect a **weekly hours** ceiling so staff near/over typical **40h** limits are skipped  

### Employee management

- Manager-level employee CRUD hooks  
- Invite creation and onboarding  
- Password reset links (email pipeline may still be manual in demo)

### Requests

- Leave and shift-change requests  
- Manager approve / reject with notes  

### Admin

- User listing and creation  
- Role updates  
- Reset-link generation  
- Audit log viewing  

### Security (high level)

- Rate limiting on sensitive routes  
- Helmet headers  
- CORS lock to allowed origins  
- Mongo sanitization and XSS-oriented helpers  
- Input validation with Joi  
- bcrypt for passwords  
- Audit logging for important actions  
- `npm audit` scripts for dependency checks  

### Monitoring

- `/health` including DB connectivity  
- External uptime checks (e.g. UptimeRobot) can point at `/health`

---

## Folder Structure Summary

### Backend

`server.js` → `config` → `models` → `controllers` → `routes` → `middleware` → `helpers` → `validation` → `cron` → `scripts`

### Frontend

Typical pattern per feature:

- `FeaturePage.jsx` — orchestration  
- `featureApi.js` — HTTP calls  
- Small presentational components for cards, tables, modals, and filters  

---

## Deployment

| Piece | Typical setup |
|--------|----------------|
| Frontend | Vercel, build from `frontEnd/vite-project` |
| Backend | Render, `npm start` |
| Database | MongoDB Atlas M0 or paid tier |
| Monitoring | Ping `/health` on a schedule |

Auto-deploy on git push when branches are linked.

---

## Known Limitations

- **Transactional email** not fully wired (reset links may be shown in API response in dev)  
- **SMS** or country-specific messaging may need local providers and compliance review  
- **Automated tests** (unit/e2e) are minimal or absent — add before production  
- **GDPR / legal pages** may need dedicated review and copy  
- **Production** load, backups, and paid tiers should be planned beyond free hosts

---

## Interview Talking Points

- **Cookies vs localStorage** for token storage and XSS  
- **Access vs refresh** tokens and silent refresh  
- **node-cron** auto checkout design  
- **Weekly cap** before sending shift notifications  
- **Invite-only** onboarding  
- **RBAC** with Express middleware  
- **Responsive** layout and component splitting  
- **Monorepo-style** split between `backEnd` and `frontEnd/vite-project` for team ownership

---

*For day-to-day commands and URLs, use `COMMANDS_REFERENCE.txt`. For API details, use `backEnd/BACKEND_README.md` and `QUICK_REFERENCE.md`.*
