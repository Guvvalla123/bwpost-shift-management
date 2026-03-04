import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import Home from "./pages/layout/Home.jsx";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

// Layouts
import ManagerLayout from "./pages/layout/ManagerLayout.jsx";
import EmployeeLayout from "./pages/layout/EmployeeLayout.jsx";

// Manager Pages
import Dashboard from "./pages/manager/Dashboard";
import ManagerShifts from "./pages/manager/shiftsfolder/ManagerShifts.jsx";
import Employee from "./pages/manager/EmployeeManagement/Employee.jsx";
import ShiftRequest from "./pages/manager/shiftsfolder/ShiftRequest.jsx";
import Calender from "./pages/manager/Calender.jsx";
import AttendanceManagement from "./pages/manager/Attendance/AttendanceManagement.jsx";
import Reports from "./pages/manager/Reports.jsx";
import Settings from "./pages/manager/Settings.jsx";

// Employee Pages
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard.jsx";
import EmployeeShifts from "./pages/Employee/EmployeeShifts.jsx";
import MyShifts from "./pages/Employee/MyShifts.jsx";
import MyRequests from "./pages/Employee/MyRequests.jsx";
import EmployeeProfile from "./pages/Employee/EmployeeProfile.jsx";

// Guards
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute.jsx";

// Toasts
import { Toaster } from "react-hot-toast";
import { Toaster as Sonner } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Sonner position="top-right" richColors />

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

        {/* ── Manager (requires login + manager role) ─────────── */}
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
            <Route path="AllShifts" element={<EmployeeShifts />} />
            <Route path="myshifts" element={<MyShifts />} />
            <Route path="requests" element={<MyRequests />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>
        </Route>

        {/* ── 404 fallback ──────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
