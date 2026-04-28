// EmployeesPage.jsx
// This is the main employee management page.
// Manager can see, add, edit, and remove employees.
//
// THIS FILE ONLY MANAGES STATE AND DATA LOADING.
// The actual UI pieces are in separate component files:
// - EmployeeCard.jsx       shows one employee on mobile as a card
// - EmployeeTable.jsx      shows employees in a table on desktop
// - AddEmployeeModal.jsx   form to add a new employee directly
// - EditEmployeeModal.jsx  form to update an employee's details
// - DeleteEmployeeModal.jsx  confirmation before deactivating
// - InviteEmployeeModal.jsx  creates a self-registration invite link
// - ResetPasswordModal.jsx   generates a password reset link

import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  Pagination,
  SkeletonTable,
  SkeletonList,
  EmptyState,
  ErrorState,
  KpiCard,
  DonutChart,
} from "@/components/ui";
import {
  Users, UserCheck, UserPlus, Mail,
  Search, X, ArrowLeft, ShieldCheck,
  Calendar, Clock, Pencil, Trash2,
} from "lucide-react";

// Import API functions from our dedicated API module
import {
  getAllEmployees,
  removeEmployee,
  getEmployeeAttendance,
  generateResetLink,
  getDashboardStats,
  copyToClipboard,
} from "./employeeApi";

// Import sub-components — each handles one piece of the UI
import EmployeeTable     from "../EmployeeManagement/EmployeeTable";
import AddEmployeeModal  from "./AddEmployeeModal";
import EditEmployeeModal from "./EditEmployeeModal";
import DeleteEmployeeModal  from "./DeleteEmployeeModal";
import InviteEmployeeModal  from "./InviteEmployeeModal";
import ResetPasswordModal   from "./ResetPasswordModal";

// ── Avatar helper constants (used in the attendance drawer) ───
const AVATAR_GRADIENTS = [
  "from-blue-600 to-[#162d5e]",
  "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

// getAvatarGradient - picks a gradient based on name's first character
function getAvatarGradient(name = "") {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

// getInitials - returns first 2 uppercase initials from a name
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// fmtDate - formats a date string to "Month Day, Year"
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

// fmtTime - formats a date string to "HH:MM AM/PM"
function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Main Page Component ────────────────────────────────────────
const EmployeesPage = () => {
  // useLocation tells us the current URL path
  // Used to determine if we are in admin context or manager context
  const location = useLocation();

  // ── Employee list state ────────────────────────────────────

  // List of employees loaded from the server
  const [employees, setEmployees] = useState([]);

  // True while loading employees from the server
  const [loading, setLoading] = useState(true);

  // Error message if loading fails
  const [fetchError, setFetchError] = useState(false);

  // Total employee count returned by the server (for pagination)
  const [totalItems, setTotalItems] = useState(0);

  // Total number of pages for the current search (for pagination)
  const [totalPages, setTotalPages] = useState(1);

  // Current page number — changes when manager clicks pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Text typed in the search box
  // Resets to page 1 when changed
  const [search, setSearch] = useState("");

  // Debounced version of the search text
  // API only called after user stops typing for 300ms
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Role filter pill — "all", "manager", or "employee"
  const [roleFilter, setRoleFilter] = useState("all");

  // ── Dashboard stats state ──────────────────────────────────

  // Dashboard stats from server — includes active employee count
  const [dashStats, setDashStats] = useState(null);

  // ── Modal open/close state ─────────────────────────────────

  // True when the Add Employee modal should be visible
  const [showAddModal, setShowAddModal] = useState(false);

  // True when the Invite Employee modal should be visible
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Employee being edited — when set, EditEmployeeModal opens
  // When null, the edit modal is hidden
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  // Employee being deleted — when set, DeleteEmployeeModal opens
  // When null, the delete confirmation is hidden
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // True while the deactivate API call is running
  // Disables the confirm button to prevent double-click
  const [isRemoving, setIsRemoving] = useState(false);

  // ── Password reset state ───────────────────────────────────

  // Employee who needs a password reset — opens ResetPasswordModal when set
  const [employeeForReset, setEmployeeForReset] = useState(null);

  // The generated reset link URL string
  // Empty means no link yet (modal shows confirm screen)
  // Non-empty means link is ready (modal shows copy screen)
  const [resetLink, setResetLink] = useState("");

  // Full reset data from server — may include userEmail and expiresAt
  const [resetData, setResetData] = useState(null);

  // True while generating the reset link
  const [isGeneratingReset, setIsGeneratingReset] = useState(false);

  // ── Attendance drawer state ────────────────────────────────

  // Employee whose attendance drawer is open
  // When null, drawer is hidden
  const [viewTarget, setViewTarget] = useState(null);

  // Attendance records for the employee in the drawer
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // True while loading attendance records for the drawer
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // ── Auto-refresh interval reference ───────────────────────
  // Stores the setInterval ID so we can clear it when component unmounts
  const refreshTimerRef = useRef(null);

  // ── Debounce: delay search API call while user is typing ──────
  // Wait 300ms after user stops typing before updating debouncedSearch
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    // Clear the previous timer if user types again before 300ms
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load employees when page first opens ──────────────────
  useEffect(() => {
    loadEmployees();
  }, []);

  // ── Reload when page number or search text changes ────────
  useEffect(() => {
    loadEmployees();
  }, [currentPage, debouncedSearch]);

  // ── Auto-refresh: reload employee list every 60 seconds ───
  useEffect(() => {
    // Start refreshing silently every 60 seconds in the background
    refreshTimerRef.current = setInterval(() => {
      loadEmployeesSilent();
    }, 60_000);

    // Stop the timer when the component is removed from the page
    return () => clearInterval(refreshTimerRef.current);
  }, [currentPage, debouncedSearch]);

  // ── Load dashboard stats when page opens ──────────────────
  useEffect(() => {
    loadDashStats();
  }, []);

  // ── ESC key closes any open modal or drawer ────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== "Escape") return;
      if (employeeToEdit) setEmployeeToEdit(null);
      if (employeeToDelete) setEmployeeToDelete(null);
      if (viewTarget) setViewTarget(null);
      if (employeeForReset) { setEmployeeForReset(null); setResetLink(""); setResetData(null); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [employeeToEdit, employeeToDelete, viewTarget, employeeForReset]);

  // ── Functions ──────────────────────────────────────────────

  // loadEmployees - fetches employee list and shows loading spinner
  // Called on page load and when page or search changes
  async function loadEmployees() {
    setLoading(true);
    setFetchError(false);
    try {
      const result = await getAllEmployees(currentPage, debouncedSearch);
      setEmployees(result.employees);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch {
      setFetchError(true);
      setEmployees([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  // loadEmployeesSilent - refreshes employee list without showing spinner
  // Used for auto-refresh so the page doesn't flicker every 60 seconds
  async function loadEmployeesSilent() {
    try {
      const result = await getAllEmployees(currentPage, debouncedSearch);
      setEmployees(result.employees);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch {
      // Silent — keep showing previous data on error
    }
  }

  // loadDashStats - loads the dashboard stats for the KPI cards
  async function loadDashStats() {
    try {
      const stats = await getDashboardStats();
      setDashStats(stats);
    } catch {
      setDashStats(null);
    }
  }

  // handleAddSuccess - called after a new employee is created
  // Closes the add modal and refreshes both list and stats
  function handleAddSuccess() {
    setShowAddModal(false);
    loadEmployees();
    loadDashStats();
  }

  // handleEditEmployee - opens the edit modal for a specific employee
  // employee - the employee object to edit (pre-fills the form)
  function handleEditEmployee(employee) {
    setEmployeeToEdit(employee);
  }

  // handleEditSuccess - called after employee is successfully updated
  // Closes the edit modal and refreshes the list
  function handleEditSuccess() {
    setEmployeeToEdit(null);
    loadEmployees();
    loadDashStats();
  }

  // handleDeleteClick - opens the delete confirmation for an employee
  // employee - the employee to deactivate (shown in the dialog)
  function handleDeleteClick(employee) {
    setEmployeeToDelete(employee);
  }

  // handleConfirmDelete - actually sends the deactivate request to server
  // Called when manager clicks "Yes, Deactivate" in the confirm dialog
  async function handleConfirmDelete() {
    if (!employeeToDelete) return;
    setIsRemoving(true);
    try {
      await removeEmployee(employeeToDelete._id);
      toast.success("Employee deactivated successfully");
      setEmployeeToDelete(null);
      loadEmployees();
      loadDashStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to deactivate employee"));
    } finally {
      setIsRemoving(false);
    }
  }

  // handleOpenDrawer - opens the attendance history drawer for an employee
  // Fetches their attendance records immediately
  // employee - the employee whose history to show
  async function handleOpenDrawer(employee) {
    setViewTarget(employee);
    setAttendanceHistory([]);
    setAttendanceLoading(true);
    try {
      const records = await getEmployeeAttendance(employee._id);
      setAttendanceHistory(records);
    } catch {
      setAttendanceHistory([]);
    } finally {
      setAttendanceLoading(false);
    }
  }

  // handleOpenResetModal - opens the password reset modal for an employee
  // Clears any previously generated link first
  // employee - the employee who needs a password reset
  function handleOpenResetModal(employee) {
    setEmployeeForReset(employee);
    setResetLink("");
    setResetData(null);
  }

  // handleCloseResetModal - closes the reset password modal
  // Also clears the generated link and employee selection
  function handleCloseResetModal() {
    setEmployeeForReset(null);
    setResetLink("");
    setResetData(null);
  }

  // handleGenerateResetLink - calls the API to create a password reset link
  // Determines if we are in admin or manager context via URL path
  async function handleGenerateResetLink() {
    if (!employeeForReset) return;
    setIsGeneratingReset(true);
    try {
      // Check URL to decide which API path to use
      const isAdmin = location.pathname.startsWith("/admin");
      const data = await generateResetLink(employeeForReset._id, isAdmin);
      setResetLink(data?.resetLink || "");
      setResetData(data);
      toast.success("Password reset link generated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate link"));
    } finally {
      setIsGeneratingReset(false);
    }
  }

  // handleSearchChange - updates the search box text and resets to page 1
  // text - the new search string typed by the manager
  function handleSearchChange(text) {
    setSearch(text);
    setCurrentPage(1);
  }

  // handlePageChange - changes which page of employees is shown
  // page - the new page number to load
  function handlePageChange(page) {
    setCurrentPage(page);
  }

  // ── Computed values for stats and filters ──────────────────

  // Number of active employees from the dashboard stats API
  const activeCount = dashStats?.stats?.totalEmployees ?? 0;

  // Donut chart data: active vs inactive employees
  const donutData = [
    { name: "Active",   value: activeCount,                           color: "#059669" },
    { name: "Inactive", value: Math.max(0, totalItems - activeCount), color: "#e5e7eb" },
  ];

  // Filter the employee list by role pill selected
  const filteredEmployees = (() => {
    if (roleFilter === "manager") return employees.filter((e) => e.role === "manager");
    if (roleFilter === "employee") return employees.filter((e) => (e.role || "employee") === "employee");
    return employees;
  })();

  // Count for each role pill badge
  const pillCounts = {
    all:      totalItems,
    manager:  employees.filter((e) => e.role === "manager").length,
    employee: totalItems,
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ── Page header: title + action buttons ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Employee Management</h1>
            <p className="mt-1 text-sm text-gray-400">Manage your team members</p>
          </div>

          {/* Invite and Add buttons — shown on all screen sizes */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {/* Invite Employee button — sends a self-registration link */}
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1B3F8B] bg-white px-4 text-sm font-semibold text-[#1B3F8B] shadow-sm transition-all duration-150 hover:bg-[#EFF6FF] active:scale-95 sm:w-auto"
            >
              <Mail className="h-4 w-4" strokeWidth={2} /> Invite Employee
            </button>

            {/* Add Employee button — manager fills in all details */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#162d5e] active:scale-95 sm:w-auto"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} /> Add Employee
            </button>
          </div>
        </div>

        {/* ── KPI cards + donut chart row ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
          {/* Two KPI stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7">
            <KpiCard variant="navy"  icon={Users}     label="Total Employees"  value={totalItems} />
            <KpiCard variant="green" icon={UserCheck} label="Active Employees" value={activeCount} />
          </div>

          {/* Donut chart — Active vs Inactive visualization */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-5">
            <p className="mb-3 w-full text-center text-xs font-medium text-gray-500">
              Active vs inactive
            </p>
            <DonutChart
              data={donutData}
              size={100}
              centerValue={String(totalItems)}
              centerLabel="total"
            />
          </div>
        </div>

        {/* ── Main employee table card ── */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Toolbar: role filter pills + search box */}
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
            {/* Role filter pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all",      label: "All",      count: pillCounts.all },
                { key: "manager",  label: "Manager",  count: pillCounts.manager },
                { key: "employee", label: "Employee", count: pillCounts.employee },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => { setRoleFilter(pill.key); setCurrentPage(1); }}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    roleFilter === pill.key
                      ? "bg-[#1B3F8B] text-white shadow-sm"
                      : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                  }`}
                >
                  {pill.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      roleFilter === pill.key
                        ? "bg-white/20 text-white"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:ml-auto sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
                aria-label="Search employees"
              />
              {/* Clear search button — only shown when there is text */}
              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Table body: loading / error / empty / data */}
          {loading ? (
            <div className="p-6">
              {/* Show skeleton table on desktop */}
              <div className="hidden md:block">
                <SkeletonTable rows={8} cols={5} />
              </div>
              {/* Show skeleton list on mobile */}
              <div className="md:hidden">
                <SkeletonList count={5} />
              </div>
            </div>
          ) : fetchError ? (
            <div className="p-6">
              {/* Error state with retry button */}
              <ErrorState
                title="Failed to load employees"
                description="Could not fetch employee list. Please try again."
                onRetry={loadEmployees}
              />
            </div>
          ) : (
            <>
              {filteredEmployees.length === 0 ? (
                /* Empty state — different message when search has no results */
                <EmptyState
                  icon={Users}
                  title={search.trim() ? "No employees found" : "No employees yet"}
                  description={
                    search.trim()
                      ? "No employees match your search. Try a different term."
                      : "Invite your first employee to get started."
                  }
                  actionLabel={search.trim() ? "Add Employee" : "Invite Employee"}
                  onAction={() =>
                    search.trim() ? setShowAddModal(true) : setShowInviteModal(true)
                  }
                />
              ) : (
                /* EmployeeTable handles both mobile cards and desktop table */
                <EmployeeTable
                  employees={filteredEmployees}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteClick}
                  onView={handleOpenDrawer}
                  onPasswordReset={handleOpenResetModal}
                />
              )}

              {/* Pagination — only shows when there are multiple pages */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={20}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ADD EMPLOYEE MODAL                                     */}
      {/* Opens when manager clicks "Add Employee" button        */}
      {/* ══════════════════════════════════════════════════════ */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* INVITE EMPLOYEE MODAL                                  */}
      {/* Opens when manager clicks "Invite Employee" button     */}
      {/* ══════════════════════════════════════════════════════ */}
      <InviteEmployeeModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {}}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* EDIT EMPLOYEE MODAL                                    */}
      {/* Opens when manager clicks the pencil icon on an emp    */}
      {/* ══════════════════════════════════════════════════════ */}
      <EditEmployeeModal
        isOpen={!!employeeToEdit}
        employee={employeeToEdit}
        onClose={() => setEmployeeToEdit(null)}
        onSuccess={handleEditSuccess}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* DELETE CONFIRMATION MODAL                              */}
      {/* Opens when manager clicks the trash icon on an emp     */}
      {/* ══════════════════════════════════════════════════════ */}
      <DeleteEmployeeModal
        isOpen={!!employeeToDelete}
        employee={employeeToDelete}
        isRemoving={isRemoving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEmployeeToDelete(null)}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* RESET PASSWORD MODAL                                   */}
      {/* Opens when manager clicks the key icon on an employee  */}
      {/* ══════════════════════════════════════════════════════ */}
      <ResetPasswordModal
        isOpen={!!employeeForReset}
        employee={employeeForReset}
        onClose={handleCloseResetModal}
        resetLink={resetLink}
        resetData={resetData}
        isGenerating={isGeneratingReset}
        onGenerate={handleGenerateResetLink}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* EMPLOYEE DETAIL DRAWER                                 */}
      {/* Slides in from the right when manager clicks eye icon  */}
      {/* Shows the employee's full attendance history           */}
      {/* ══════════════════════════════════════════════════════ */}
      {viewTarget && (
        /* Dark backdrop — clicking it closes the drawer */
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setViewTarget(null)}
        >
          {/* Drawer panel — slides in from right */}
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header with blue gradient background */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#162d5e] px-6 pt-8 pb-10">
              {/* Back button to close the drawer */}
              <button
                onClick={() => setViewTarget(null)}
                className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm mb-6 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {/* Employee avatar + name + email */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarGradient(viewTarget.username)} flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white/20`}
                >
                  {getInitials(viewTarget.username)}
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{viewTarget.username}</p>
                  <p className="text-blue-200 text-sm mt-0.5">{viewTarget.email}</p>
                </div>
              </div>
            </div>

            {/* Info pills: Role and Join Date */}
            <div className="-mt-5 mx-6 grid grid-cols-2 gap-3">
              {/* Role pill */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">Employee</p>
                </div>
              </div>

              {/* Joined date pill */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Joined</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{fmtDate(viewTarget.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Attendance history list */}
            <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Attendance History
              </p>

              {attendanceLoading ? (
                /* Loading spinner while fetching records */
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                </div>
              ) : attendanceHistory.length === 0 ? (
                /* Empty state if no attendance records exist */
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <Clock className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No attendance records yet</p>
                </div>
              ) : (
                /* List of attendance record cards */
                <div className="space-y-3">
                  {attendanceHistory.map((rec, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      {/* Shift title + total hours badge */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-800 truncate pr-2">
                          {rec.shiftTitle || "Shift"}
                        </p>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                          {rec.totalHours != null ? `${rec.totalHours}h` : "—"}
                        </span>
                      </div>

                      {/* Check-in and check-out times */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>
                          <p className="text-gray-400 mb-0.5">Check In</p>
                          <p className="font-medium text-gray-700">
                            {fmtDate(rec.checkIn)} {fmtTime(rec.checkIn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-0.5">Check Out</p>
                          <p className="font-medium text-gray-700">
                            {fmtDate(rec.checkOut)} {fmtTime(rec.checkOut)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer footer: Edit and Delete action buttons */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              {/* Edit button — closes drawer and opens edit modal */}
              <button
                onClick={() => { setViewTarget(null); handleEditEmployee(viewTarget); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-[#162d5e] text-white font-semibold rounded-xl text-sm hover:shadow-md transition"
              >
                <Pencil className="h-4 w-4" /> Edit Employee
              </button>

              {/* Delete button — closes drawer and opens delete confirm */}
              <button
                onClick={() => { setViewTarget(null); handleDeleteClick(viewTarget); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
