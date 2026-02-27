import React from "react";
import { Routes, Route } from "react-router-dom";

//Auth Imports
import Home from "./pages/layout/Home.jsx";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

//Layout Imports
import ManagerLayout from "./pages/layout/ManagerLayout.jsx";
import EmployeeLayout from "./pages/layout/EmployeeLayout.jsx";

//Manager Imports 
import Dashboard from "./pages/manager/Dashboard";
import ManagerShifts from "./pages/manager/shiftsfolder/ManagerShifts.jsx";
import Employee from "./pages/manager/EmployeeManagement/Employee.jsx";
import ShiftRequest from "./pages/manager/shiftsfolder/ShiftRequest.jsx";
import Calender from "./pages/manager/Calender.jsx";
import AttendanceManagement from "./pages/manager/Attendance/AttendanceManagement.jsx";

//Employee Imports
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard.jsx";
import EmployeeShifts from "./pages/Employee/EmployeeShifts.jsx";

//react 
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";


function App() {
  return (
    <>
      <Toaster position="top-right" />
      <SonnerToaster position="top-right" richColors />


      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Employee Routes */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="AllShifts" element={<EmployeeShifts />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="shifts" element={<ManagerShifts />} />
          <Route path="employees" element={<Employee />} />
          <Route path="shiftrequests" element={<ShiftRequest />} />
          <Route path="calender" element={<Calender />} />
          <Route path="attendance" element={<AttendanceManagement />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
