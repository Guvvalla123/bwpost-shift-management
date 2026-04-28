import React, { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

// Public pages (lazy loaded — smaller initial bundle)
const Home = lazy(() => import("./pages/layout/Home.jsx"));
const Register = lazy(() => import("./pages/auth/Register"));
const Login = lazy(() => import("./pages/auth/Login"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Layouts (lazy loaded)
const AdminLayout = lazy(() => import("./pages/layout/AdminLayout.jsx"));
const ManagerLayout = lazy(() => import("./pages/layout/ManagerLayout.jsx"));
const EmployeeLayout = lazy(() => import("./pages/layout/EmployeeLayout.jsx"));

// Manager Pages (lazy loaded — only when a manager navigates here)
const Dashboard = lazy(() => import("./pages/manager/dashboard/ManagerDashboard"));
// Updated to use the refactored ShiftsPage from the new shifts/ folder
const ManagerShifts = lazy(() => import("./pages/manager/shifts/ShiftsPage.jsx"));
// Updated to use the refactored EmployeesPage from the new employees/ folder
const Employee = lazy(() => import("./pages/manager/employees/EmployeesPage.jsx"));
const ShiftRequest = lazy(() => import("./pages/manager/requests/RequestsPage.jsx"));
const Calender = lazy(() => import("./pages/manager/Calender.jsx"));
// Updated to use the refactored AttendancePage from the new attendance/ folder
const AttendanceManagement = lazy(() => import("./pages/manager/attendance/AttendancePage.jsx"));
const Reports = lazy(() => import("./pages/manager/reports/ReportsPage.jsx"));
const Settings = lazy(() => import("./pages/manager/settings/SettingsPage.jsx"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
// Updated to use the refactored UsersPage from the new users/ folder
const AdminUserManagement = lazy(() => import("./pages/admin/users/UsersPage.jsx"));
const ManagersPage = lazy(() => import("./pages/admin/managers/ManagersPage.jsx"));
const InvitesPage = lazy(() => import("./pages/admin/invites/InvitesPage.jsx"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog.jsx"));

// Employee Pages (lazy loaded)
const EmployeeDashboard = lazy(() => import("./pages/employee/dashboard/EmployeeDashboard.jsx"));
const EmployeeCheckIn = lazy(() => import("./pages/employee/checkin/CheckInPage.jsx"));
const EmployeeShifts = lazy(() => import("./pages/Employee/EmployeeShifts.jsx"));
const MyShifts = lazy(() => import("./pages/employee/myshifts/MyShiftsPage.jsx"));
const MyRequests = lazy(() => import("./pages/employee/myrequests/MyRequestsPage.jsx"));
const ProfilePage = lazy(() => import("./pages/employee/profile/ProfilePage.jsx"));

// Guards
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute.jsx";

// Toast notifications (single library)
import { Toaster as Sonner } from "sonner";
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F8F9FC]">
    <div className="flex flex-col items-center gap-3">
      <p className="text-2xl font-bold tracking-tight text-[#1B3F8B] animate-pulse" aria-label="Loading">
        BW
        <span className="font-extralight">POST</span>
      </p>
    </div>
  </div>
);

function ToasterRouted() {
  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const f = () => setIsMdUp(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return (
    <Sonner
      position={isMdUp ? "top-right" : "top-center"}
      duration={3000}
      richColors
      closeButton={false}
      swipeDirection="right"
      toastOptions={{
        duration: 3000,
        style: { maxWidth: "90vw" },
      }}
    />
  );
}

function App() {
  return (
    <>
      <ToasterRouted />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public (redirect to dashboard if already logged in) ── */}
          <Route path="/" element={
            <PublicRoute><Home /></PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute><Register /></PublicRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── Admin (requires login + admin role; Admin-only routes) ────────────── */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="managers" element={<ManagersPage />} />
              <Route path="invites" element={<InvitesPage />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="employees" element={<Employee />} />
              <Route path="calendar" element={<Calender />} />
              <Route path="attendance" element={<AttendanceManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* ── Manager (requires login + manager role only; Admin stays in /admin/*) ── */}
          <Route element={<ProtectedRoute requiredRole="manager" />}>
            <Route path="/manager" element={<ManagerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="shifts" element={<ManagerShifts />} />
              <Route path="employees" element={<Employee />} />
              <Route path="shiftrequests" element={<ShiftRequest />} />
              <Route path="calender" element={<Calender />} />
              <Route path="attendance" element={<AttendanceManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* ── Employee (requires login + employee role) ─────────── */}
          <Route element={<ProtectedRoute requiredRole="employee" />}>
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="checkin" element={<EmployeeCheckIn />} />
              <Route path="AllShifts" element={<EmployeeShifts />} />
              <Route path="myshifts" element={<MyShifts />} />
              <Route path="requests" element={<MyRequests />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

        {/* ── 404 fallback ──────────────────────────────────────── */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC] px-6">
            <div className="text-center max-w-md">
              <p className="text-7xl font-black text-gray-200 mb-4">404</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
              <p className="text-gray-500 mb-6">The page you are looking for does not exist or has been moved.</p>
              <Link
                to="/"
                className="inline-block rounded-xl bg-[#1B3F8B] px-6 py-2.5 font-medium text-white transition-all duration-150 hover:bg-[#1B3F8B]/90 active:scale-95"
              >
                Go Home
              </Link>
            </div>
          </div>
        } />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
