import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
const Dashboard = lazy(() => import("./pages/manager/Dashboard"));
const ManagerShifts = lazy(() => import("./pages/manager/shiftsfolder/ManagerShifts.jsx"));
const Employee = lazy(() => import("./pages/manager/EmployeeManagement/Employee.jsx"));
const ShiftRequest = lazy(() => import("./pages/manager/shiftsfolder/ShiftRequest.jsx"));
const Calender = lazy(() => import("./pages/manager/Calender.jsx"));
const AttendanceManagement = lazy(() => import("./pages/manager/Attendance/AttendanceManagement.jsx"));
const Reports = lazy(() => import("./pages/manager/Reports.jsx"));
const Settings = lazy(() => import("./pages/manager/Settings.jsx"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminUserManagement = lazy(() => import("./pages/admin/AdminUserManagement.jsx"));
const AdminManagerManagement = lazy(() => import("./pages/admin/AdminManagerManagement.jsx"));
const AdminInviteManagement = lazy(() => import("./pages/admin/AdminInviteManagement.jsx"));

// Employee Pages (lazy loaded)
const EmployeeDashboard = lazy(() => import("./pages/Employee/EmployeeDashboard.jsx"));
const EmployeeCheckIn = lazy(() => import("./pages/Employee/EmployeeCheckIn.jsx"));
const EmployeeShifts = lazy(() => import("./pages/Employee/EmployeeShifts.jsx"));
const MyShifts = lazy(() => import("./pages/Employee/MyShifts.jsx"));
const MyRequests = lazy(() => import("./pages/Employee/MyRequests.jsx"));
const EmployeeProfile = lazy(() => import("./pages/Employee/EmployeeProfile.jsx"));

// Guards
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute.jsx";

// Toast notifications (single library)
import { Toaster as Sonner } from "sonner";

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <>
      <Sonner
        position="top-right"
        duration={3000}
        richColors
        closeButton={false}
        swipeDirection="right"
        toastOptions={{
          duration: 3000,
          style: { maxWidth: "90vw" },
        }}
      />

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
              <Route path="managers" element={<AdminManagerManagement />} />
              <Route path="invites" element={<AdminInviteManagement />} />
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
              <Route path="profile" element={<EmployeeProfile />} />
            </Route>
          </Route>

        {/* ── 404 fallback ──────────────────────────────────────── */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
            <div className="text-center max-w-md">
              <p className="text-7xl font-black text-slate-200 mb-4">404</p>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
              <p className="text-slate-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
              <a href="/" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition inline-block">Go Home</a>
            </div>
          </div>
        } />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
