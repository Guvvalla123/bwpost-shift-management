// AttendancePage.jsx
// This is the main attendance page for managers.
// Manager selects a shift to see who checked in,
// who is late, who is absent, and take manual actions.
//
// THIS FILE ONLY MANAGES STATE AND DATA.
// The actual UI is built by separate component files:
//   AttendanceFilters.jsx      — shift selector + search + export button
//   AttendanceStats.jsx        — KPI cards (Present/Late/Absent) + donut chart
//   AttendanceCard.jsx         — one employee record card (mobile)
//   AttendanceTableRow.jsx     — one employee record row (desktop)
//   EmployeeAttendanceDrawer.jsx — employee's full attendance history panel
//
// HOW DATA FLOWS:
//   AttendancePage loads shifts → manager picks one
//   AttendancePage loads attendance for that shift
//   Attendance records are passed to the card/row components
//   When employee is clicked → drawer opens with their history
//   When action button is clicked → API call runs → list reloads

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";

// Lucide icons used in this file
import {
  CalendarDays as CalIcon,
  ClipboardList as ClipIcon,
  Briefcase, Users, FileText, Calendar,
} from "lucide-react";

// Shared UI components from the component library
import {
  SkeletonTable as SkelTable,
  SkeletonList as SkelList,
  EmptyState as EmptyS,
  ErrorState as ErrState,
} from "@/components/ui";

// API helper functions — all live in attendanceApi.js
import {
  getAllShifts,
  getShiftAttendance,
  getEmployeeAttendance,
  checkInEmployee,
  checkOutEmployee,
  startBreak,
  endBreak,
  exportAttendanceCSV,
  formatDate,
  formatTime,
} from "./attendanceApi";

// Page-specific component files
import AttendanceFilters from "./AttendanceFilters";
import AttendanceStats from "./AttendanceStats";
import AttendanceCard from "./AttendanceCard";
import AttendanceTableRow from "./AttendanceTableRow";
import EmployeeAttendanceDrawer from "./EmployeeAttendanceDrawer";

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const AttendancePage = () => {

  // ── STATE: Shifts list for the dropdown ────────────────
  // List of all shifts loaded from the server
  // Used to populate the ShiftSelect dropdown in AttendanceFilters
  const [shifts, setShifts] = useState([]);

  // True while the shifts list is being loaded
  const [shiftsLoading, setShiftsLoading] = useState(true);

  // Text typed in the date filter
  // Filters the shifts list to show only shifts on that date
  const [dateFilter, setDateFilter] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  // ── STATE: Selected shift and its attendance ────────────
  // The _id of the shift that is currently selected
  // Empty string means no shift is selected yet
  const [selectedShiftId, setSelectedShiftId] = useState("");

  // The shift object returned with the attendance data
  // Has the full shift details (title, times, manager, notes)
  const [selectedShiftDetails, setSelectedShiftDetails] = useState(null);

  // List of attendance records for the selected shift
  // Each record is one employee's attendance for this shift
  const [attendanceList, setAttendanceList] = useState([]);

  // True while loading attendance for the selected shift
  const [loading, setLoading] = useState(false);

  // True if loading the attendance list failed
  const [loadError, setLoadError] = useState(false);

  // Timestamp of last successful load (shown on mobile)
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  // ── STATE: Search and filtering ────────────────────────
  // Text typed in the employee search box
  // Filters the attendance list in real time (no API call)
  const [searchText, setSearchText] = useState("");

  // ── STATE: Action buttons ──────────────────────────────
  // The employeeId whose action (check-in/out/break) is in progress
  // While set, that employee's buttons are disabled and show spinner
  const [actionBusy, setActionBusy] = useState(null);

  // ── STATE: Employee history drawer ─────────────────────
  // The employee whose history is being viewed
  // When set the drawer opens on the right side
  // When null the drawer is hidden
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Attendance history for the selected employee
  // Loaded when an employee is clicked in the table
  const [employeeHistory, setEmployeeHistory] = useState([]);

  // True while loading the employee's attendance history
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── STATE: Computed attendance stats ───────────────────
  // Counts for the KPI cards and donut chart
  // Recalculated after every attendance load
  const [stats, setStats] = useState({
    present: 0,  // checked in and on time
    late: 0,     // checked in but late
    absent: 0,   // never checked in
    total: 0,    // total employees in the shift
  });

  // ── REF: for silent auto-refresh ───────────────────────
  // Stores the latest silent-refresh function so the 60-second
  // interval can always call the most up-to-date version
  const silentRefreshRef = useRef(null);

  // ─────────────────────────────────────────────────────────
  // FUNCTION: loadShifts
  // Loads all shifts from the server for the dropdown.
  // Called once when the page first opens.
  // ─────────────────────────────────────────────────────────
  async function loadShifts() {
    try {
      setShiftsLoading(true);
      const data = await getAllShifts();
      setShifts(data);
    } catch {
      toast.error("Failed to load shifts");
    } finally {
      setShiftsLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: loadAttendance
  // Loads the attendance records for the selected shift.
  // silent = true means don't show the loading spinner.
  // ─────────────────────────────────────────────────────────
  async function loadAttendance(shiftId, silent = false) {
    if (!shiftId) return;
    try {
      if (!silent) {
        setLoading(true);
        setLoadError(false);
      }
      const data = await getShiftAttendance(shiftId);
      const records = data.attendance || [];
      setAttendanceList(records);
      setSelectedShiftDetails(data.shift);
      setLastUpdated(new Date());
      // Recalculate stat counts from the new records
      calculateStats(records);
    } catch (err) {
      if (!silent) {
        setLoadError(true);
        toast.error(getApiErrorMessage(err, "Failed to load attendance"));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: calculateStats
  // Counts present, late, and absent employees from the records.
  // Called after every attendance load to update the KPI cards.
  // ─────────────────────────────────────────────────────────
  function calculateStats(records) {
    // Present = checked in AND not late
    const presentCount = records.filter(
      (r) => r.status !== "not_started" && !r.isLate
    ).length;
    // Late = checked in BUT was late
    const lateCount = records.filter(
      (r) => r.isLate && r.status !== "not_started"
    ).length;
    // Absent = never checked in (status is still "not_started")
    const absentCount = records.filter((r) => r.status === "not_started").length;

    setStats({
      present: presentCount,
      late:    lateCount,
      absent:  absentCount,
      total:   records.length,
    });
  }

  // ─────────────────────────────────────────────────────────
  // EFFECT: Load shifts when page first opens
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadShifts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────
  // EFFECT: Load attendance when selected shift changes
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedShiftId) {
      // Reset search when switching shifts
      setSearchText("");
      loadAttendance(selectedShiftId, false);
    } else {
      // Clear data when no shift is selected
      setAttendanceList([]);
      setSelectedShiftDetails(null);
      setStats({ present: 0, late: 0, absent: 0, total: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShiftId]);

  // ─────────────────────────────────────────────────────────
  // EFFECT: Auto-refresh every 60 seconds
  // Quietly reloads attendance in the background without
  // showing the loading spinner to the manager.
  // ─────────────────────────────────────────────────────────
  silentRefreshRef.current = () => loadAttendance(selectedShiftId, true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (silentRefreshRef.current && selectedShiftId) {
        silentRefreshRef.current();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [selectedShiftId]);

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleShiftChange
  // Called when manager picks a shift from the dropdown.
  // Updates selectedShiftId which triggers the useEffect above.
  // ─────────────────────────────────────────────────────────
  function handleShiftChange(shiftId) {
    setSelectedShiftId(shiftId);
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleViewEmployee
  // Called when manager clicks on an employee name or avatar.
  // Opens the employee history drawer and loads their records.
  // ─────────────────────────────────────────────────────────
  async function handleViewEmployee(employee) {
    // Show the drawer immediately with loading state
    setSelectedEmployee(employee);
    setEmployeeHistory([]);
    setLoadingHistory(true);
    try {
      const data = await getEmployeeAttendance(employee._id);
      setEmployeeHistory(data?.attendanceHistory || []);
    } catch {
      toast.error("Failed to load employee history");
    } finally {
      setLoadingHistory(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleCloseDrawer
  // Called when manager clicks X on the employee drawer.
  // Hides the drawer and clears the history data.
  // ─────────────────────────────────────────────────────────
  function handleCloseDrawer() {
    setSelectedEmployee(null);
    setEmployeeHistory([]);
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: runAction
  // Generic helper for all action buttons (check-in, out, break).
  // Shows busy state while the API call runs, then silently reloads.
  // ─────────────────────────────────────────────────────────
  async function runAction(employeeId, apiCall) {
    // Mark this employee as busy so the buttons disable
    setActionBusy(employeeId);
    try {
      await apiCall();
      // Quietly reload without showing the spinner
      await loadAttendance(selectedShiftId, true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed. Please try again."));
    } finally {
      setActionBusy(null);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleCheckIn
  // Called when Check In button is clicked on an employee.
  // ─────────────────────────────────────────────────────────
  function handleCheckIn(employeeId) {
    runAction(employeeId, () => checkInEmployee(selectedShiftId, employeeId));
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleCheckOut
  // Called when Out (check out) button is clicked.
  // ─────────────────────────────────────────────────────────
  function handleCheckOut(employeeId) {
    runAction(employeeId, () => checkOutEmployee(selectedShiftId, employeeId));
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleBreakStart
  // Called when Break or Lunch button is clicked.
  // breakType: "short_break" for break, "lunch" for lunch
  // ─────────────────────────────────────────────────────────
  function handleBreakStart(employeeId, breakType) {
    runAction(employeeId, () => startBreak(selectedShiftId, employeeId, breakType));
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleBreakEnd
  // Called when Resume button is clicked for an employee on break.
  // ─────────────────────────────────────────────────────────
  function handleBreakEnd(employeeId) {
    runAction(employeeId, () => endBreak(selectedShiftId, employeeId));
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleExportCSV
  // Called when Export CSV button is clicked.
  // Builds and downloads a CSV file of the current attendance.
  // ─────────────────────────────────────────────────────────
  function handleExportCSV() {
    exportAttendanceCSV(selectedShiftDetails, attendanceList);
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: getFilteredAttendance
  // Returns attendance records filtered by the search text.
  // No API call — just filters the already-loaded records.
  // ─────────────────────────────────────────────────────────
  function getFilteredAttendance() {
    if (!searchText.trim()) return attendanceList;
    const query = searchText.toLowerCase();
    return attendanceList.filter((rec) => {
      const name  = rec.employee?.username?.toLowerCase() || "";
      const email = rec.employee?.email?.toLowerCase() || "";
      return name.includes(query) || email.includes(query);
    });
  }

  // ── Compute donut chart data from stats ──────────────────
  const donutData = [
    { name: "Present", value: stats.present, color: "#1B3F8B" },
    { name: "Late",    value: stats.late,    color: "#f59e0b" },
    { name: "Absent",  value: stats.absent,  color: "#ef4444" },
  ];

  // ── Compute which shifts to show in the dropdown ─────────
  // Filter shifts by the selected date (only show shifts on that day)
  const shiftsForDate = dateFilter
    ? shifts.filter((s) => {
        const shiftDay = new Date(s.shiftStartTime);
        const filterDay = new Date(`${dateFilter}T12:00:00`);
        return (
          shiftDay.getFullYear() === filterDay.getFullYear() &&
          shiftDay.getMonth()    === filterDay.getMonth() &&
          shiftDay.getDate()     === filterDay.getDate()
        );
      })
    : shifts;

  // The filtered + searched attendance list
  const filteredAttendance = getFilteredAttendance();

  // Computed counts for the footer summary line
  const completedCount = attendanceList.filter((r) => r.status === "checked_out").length;
  const onBreakCount   = attendanceList.filter((r) => r.status === "on_break").length;
  const absentCount    = attendanceList.filter((r) => r.status === "not_started").length;

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#F8F9FC]">

      {/* ── Page header with title and date filter ── */}
      <div className="border-b border-gray-200 bg-white px-4 pb-0 pt-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-500 mt-1">Track daily team attendance</p>
            </div>
          </div>

          {/* Date filter — narrows the shift dropdown to one day */}
          <div className="mb-5 flex w-full flex-col gap-1 sm:w-auto sm:min-w-[200px]">
            <label className="text-xs font-medium text-gray-500" htmlFor="attendance-date">
              Filter by date
            </label>
            <input
              id="attendance-date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 min-h-[44px] w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 sm:w-[200px]"
            />
          </div>

          {/* Tab-style description bar */}
          <div className="flex gap-1 -mb-px">
            <div className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border border-b-0 bg-gray-50 border-gray-200 text-[#1B3F8B]">
              <ClipIcon className="w-4 h-4" />
              Attendance
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8">

        {/* Show skeleton while the initial shifts list is loading */}
        {shiftsLoading ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-24 animate-pulse" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 h-20 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Shift selector + search + export button */}
            <AttendanceFilters
              shifts={shiftsForDate}
              selectedShiftId={selectedShiftId}
              onShiftChange={handleShiftChange}
              searchText={searchText}
              onSearchChange={setSearchText}
              onExportCSV={handleExportCSV}
            />

            {/* ── Shift details card (only shown when a shift is selected) ── */}
            {selectedShiftId && !loading && selectedShiftDetails && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Blue header */}
                <div className="bg-gradient-to-r from-[#1B3F8B] via-[#2563EB] to-blue-600 px-6 py-5">
                  <h2 className="text-lg font-bold text-white">Shift Details</h2>
                  <p className="text-indigo-100 text-sm mt-0.5">Complete overview of the selected shift</p>
                </div>
                {/* Detail grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Shift name */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CalIcon className="w-3.5 h-3.5" /> Shift
                      </p>
                      <p className="text-base font-bold text-gray-900">{selectedShiftDetails.shiftTitle}</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(selectedShiftDetails.shiftStartTime)} – {formatTime(selectedShiftDetails.shiftEndTime)}
                      </p>
                    </div>
                    {/* Date */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Date
                      </p>
                      <p className="text-base font-semibold text-gray-800">{formatDate(selectedShiftDetails.shiftStartTime)}</p>
                    </div>
                    {/* Manager */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Manager
                      </p>
                      {selectedShiftDetails.manager ? (
                        <>
                          <p className="text-base font-semibold text-gray-800">{selectedShiftDetails.manager.username}</p>
                          <p className="text-xs text-gray-500 truncate">{selectedShiftDetails.manager.email}</p>
                        </>
                      ) : <p className="text-sm text-gray-400">—</p>}
                    </div>
                    {/* Employees count */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Employees Assigned
                      </p>
                      <p className="text-base font-bold text-gray-900">{attendanceList.length}</p>
                      <p className="text-xs text-gray-500">
                        {attendanceList.filter((r) => r.status !== "not_started").length} present ·{" "}
                        {attendanceList.filter((r) => r.status === "not_started").length} not started
                      </p>
                    </div>
                  </div>
                  {/* Shift notes if any */}
                  {selectedShiftDetails.shiftNotes && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <FileText className="w-3.5 h-3.5" /> Notes
                      </p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        {selectedShiftDetails.shiftNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KPI cards + donut chart — shown when shift is selected and loaded */}
            {selectedShiftId && !loading && (
              <AttendanceStats
                presentCount={stats.present}
                lateCount={stats.late}
                absentCount={stats.absent}
                donutData={donutData}
                totalCount={stats.total}
              />
            )}

            {/* ── Attendance list card ── */}
            {selectedShiftId && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-800">Employee Attendance</h2>
                  {selectedShiftDetails && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <CalIcon className="w-3 h-3" />
                      {selectedShiftDetails.shiftTitle} · {formatDate(selectedShiftDetails.shiftStartTime)} ·{" "}
                      {formatTime(selectedShiftDetails.shiftStartTime)}–{formatTime(selectedShiftDetails.shiftEndTime)}
                    </p>
                  )}
                </div>

                {/* Loading skeleton */}
                {loading ? (
                  <div className="p-6">
                    <div className="hidden md:block">
                      <SkelTable rows={6} cols={7} />
                    </div>
                    <div className="md:hidden">
                      <SkelList count={5} />
                    </div>
                  </div>
                ) : loadError ? (
                  // Error state
                  <div className="p-6">
                    <ErrState
                      title="Failed to load attendance"
                      description="Could not load attendance records. Please try again."
                      onRetry={() => loadAttendance(selectedShiftId, false)}
                    />
                  </div>
                ) : filteredAttendance.length === 0 ? (
                  // Empty state
                  <EmptyS
                    icon={ClipIcon}
                    title={attendanceList.length === 0 ? "No attendance records" : "No matching employees"}
                    description={
                      attendanceList.length === 0
                        ? "Attendance records will appear when employees check in."
                        : "Try a different search term."
                    }
                  />
                ) : (
                  <>
                    {/* Mobile: card list */}
                    <div className="md:hidden space-y-3 px-4 pb-4 pt-4">
                      {filteredAttendance.map((record) => (
                        <AttendanceCard
                          key={record.employee?._id || record._id}
                          record={record}
                          selectedShift={selectedShiftDetails}
                          onViewEmployee={handleViewEmployee}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onBreakStart={handleBreakStart}
                          onBreakEnd={handleBreakEnd}
                          actionBusy={actionBusy}
                        />
                      ))}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {["Employee", "Status", "Sessions", "Work", "Break", "Flags", "Action"].map(
                              (header, i) => (
                                <th
                                  key={header}
                                  className={`px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider ${
                                    i === 6 ? "text-right" : "text-left"
                                  }`}
                                >
                                  {header}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredAttendance.map((record) => (
                            <AttendanceTableRow
                              key={record.employee?._id || record._id}
                              record={record}
                              onViewEmployee={handleViewEmployee}
                              onCheckIn={handleCheckIn}
                              onCheckOut={handleCheckOut}
                              onBreakStart={handleBreakStart}
                              onBreakEnd={handleBreakEnd}
                              actionBusy={actionBusy}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Footer: counts summary */}
                {!loading && filteredAttendance.length > 0 && (
                  <>
                    <div className="px-5 py-3 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-gray-400">
                        <span className="font-semibold text-gray-600">{filteredAttendance.length}</span> employees · auto-refreshes every 60s
                      </p>
                      <p className="text-xs text-gray-400">
                        <span className="font-semibold text-emerald-600">{completedCount}</span> completed ·{" "}
                        <span className="font-semibold text-amber-500">{onBreakCount}</span> on break ·{" "}
                        <span className="font-semibold text-rose-500">{absentCount}</span> not started
                      </p>
                    </div>
                    {/* Last updated time — mobile only */}
                    <p className="text-xs text-gray-400 text-center py-3 md:hidden px-5">
                      Updated{" "}
                      {lastUpdated.toLocaleTimeString("en-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Empty prompt shown when no shift is selected yet */}
            {!selectedShiftId && (
              <div className="bg-white rounded-2xl border border-gray-200 border-dashed flex flex-col items-center justify-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <CalIcon className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-base font-bold text-gray-600">Please select a shift to view details</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm text-center">
                  Choose a shift from the dropdown above to see attendance, assigned employees, and their status.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Employee attendance history drawer */}
      {/* Slides in from the right when an employee is clicked */}
      <EmployeeAttendanceDrawer
        employee={selectedEmployee}
        attendanceHistory={employeeHistory}
        loading={loadingHistory}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default AttendancePage;
