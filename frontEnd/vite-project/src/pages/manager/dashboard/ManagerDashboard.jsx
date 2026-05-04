// ManagerDashboard.jsx
// Main dashboard page for managers.
// Shows an overview of team shifts and attendance for today.
// Auto-refreshes every 60 seconds.
//
// THIS FILE MANAGES STATE AND DATA.
// UI pieces are in separate component files:
// - DashboardStats.jsx      4 KPI cards at the top
// - ShiftStatusDonut.jsx    donut chart for shifts by status
// - StaffPresenceDonut.jsx  donut chart for staff attendance
// - RecentActivityList.jsx  list of 5 most recent shifts

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ErrorState, DonutChart,
  SkeletonKpi, SkeletonDonutPlaceholder, SkeletonList,
} from "@/components/ui";
import { Users, X, UserCheck } from "lucide-react";
import { getApiErrorMessage } from "@/utils/apiError";
import { getStatus } from "@/utils/shiftStatus";

// Import API function
import { getDashboardData } from "./dashboardApi";

// Import sub-components
import DashboardStats from "./DashboardStats";
import ShiftStatusDonut from "./ShiftStatusDonut";
import StaffPresenceDonut from "./StaffPresenceDonut";
import RecentActivityList from "./RecentActivityList";

// ── Color constants ────────────────────────────────────────────
const SHIFT_STATUS_COLORS = {
  ongoing: "#059669",
  upcoming: "#1B3F8B",
  needsStaff: "#f59e0b",
  completed: "#d1d5db",
};

// GRADS - gradient colors for employee avatar circles
const GRADS = [
  "from-[#1B3F8B] to-[#162d5e]",
  "from-[#2563EB] to-[#1B3F8B]",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-[#2563EB]",
];
function getGradient(name = "") { return GRADS[(name.charCodeAt(0) || 0) % GRADS.length]; }
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// ── Shift classification helpers ──────────────────────────────

// classifyShiftForDonut - determines which donut segment a shift belongs to
function classifyShiftForDonut(shift) {
  const s = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const open = shift.slotsAvailable ?? 0;
  if (s === "ongoing") return "ongoing";
  if (s === "completed") return "completed";
  if (s === "upcoming" && open > 0) return "needsStaff";
  if (s === "upcoming") return "upcoming";
  return "completed";
}

// scaleCountsToTotal - scales segment counts so they sum to exactly totalShiftCount
// This avoids rounding errors in the donut chart.
function scaleCountsToTotal(raw, total) {
  const keys = ["ongoing", "upcoming", "needsStaff", "completed"];
  const sum = keys.reduce((a, k) => a + raw[k], 0);
  if (total <= 0 || sum <= 0) return { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  const scaled = keys.map((k) => Math.round((raw[k] / sum) * total));
  const diff = total - scaled.reduce((a, b) => a + b, 0);
  // Add rounding remainder to the largest segment
  const maxIdx = scaled.indexOf(Math.max(...scaled));
  scaled[maxIdx] += diff;
  return { ongoing: scaled[0], upcoming: scaled[1], needsStaff: scaled[2], completed: scaled[3] };
}

// ── Shift Detail Panel (inline) ────────────────────────────────
// ShiftModal - slide-in right panel showing full shift details
// Kept inline because it is specific to dashboard context.
const ShiftModal = ({ shift, onClose }) => {
  if (!shift) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

  const STATUS = {
    upcoming: { label: "Upcoming", dot: "bg-[#1B3F8B]" },
    ongoing: { label: "Ongoing", dot: "bg-emerald-500" },
    completed: { label: "Completed", dot: "bg-slate-400" },
  };

  const filled = shift.acceptedEmployees?.length || 0;
  const total = shift.slotsAvailable || 0;
  const pct = total > 0 ? Math.min(Math.round((filled / total) * 100), 100) : 0;
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const st = STATUS[status] || STATUS.upcoming;
  const bar = pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-[#1B3F8B]" : "bg-amber-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-4 sm:p-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="h-full w-full animate-in slide-in-from-right overflow-y-auto bg-white shadow-2xl duration-300 sm:w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue gradient header */}
        <div className="bg-gradient-to-br from-[#1B3F8B] via-[#1B3F8B] to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-3">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="truncate text-xl font-bold leading-tight text-white">{shift.shiftTitle}</h2>
              <p className="mt-2 text-sm text-white/70">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-white transition hover:bg-white/20 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Slot capacity section */}
        <div className="border-b border-gray-100 p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Slot Capacity</p>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold tabular-nums text-gray-900">{filled}</span>
              <span className="text-lg font-medium text-gray-400">/{total}</span>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: pct >= 80 ? "#10b981" : pct >= 40 ? "#1B3F8B" : "#f59e0b" }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {total - filled} slot{total - filled !== 1 ? "s" : ""} remaining
          </p>
        </div>

        {/* Shift notes */}
        {shift.shiftNotes && (
          <div className="border-b border-gray-100 px-6 py-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Notes</p>
            <p className="text-sm leading-relaxed text-gray-700">{shift.shiftNotes}</p>
          </div>
        )}

        {/* Accepted employees list */}
        <div className="px-6 py-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Accepted Employees ({filled})
          </p>
          {shift.acceptedEmployees?.length > 0 ? (
            <div className="space-y-2">
              {shift.acceptedEmployees.map((emp, idx) => (
                <div key={emp._id} className="hover:bg-gray-50 group flex items-center gap-3 rounded-xl p-3 transition-colors">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getGradient(emp.username)} text-sm font-bold text-white shadow-sm`}>
                    {getInitials(emp.username)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{emp.username}</p>
                    <p className="truncate text-xs text-gray-400">{emp.email}</p>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-gray-300">#{idx + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <UserCheck className="mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm font-medium text-gray-500">No employees yet</p>
              <p className="mt-1 text-xs text-gray-400">Employees will appear once they accept this shift.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
const ManagerDashboard = () => {
  const navigate = useNavigate();

  // All dashboard data from server
  const [dashboardData, setDashboardData] = useState(null);

  // True while loading data
  const [loading, setLoading] = useState(true);

  // Error message if loading fails
  const [error, setError] = useState("");

  // The shift currently shown in the details panel (null = closed)
  const [selectedShift, setSelectedShift] = useState(null);

  // Auto-refresh interval reference
  const refreshTimerRef = useRef(null);

  // Load dashboard when page opens
  useEffect(() => {
    loadDashboard();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      loadDashboardSilent();
    }, 60_000);
    return () => clearInterval(refreshTimerRef.current);
  }, []);

  // Keyboard shortcut: Escape key closes the shift details panel
  useEffect(() => {
    function handleKeydown(e) {
      if (e.key === "Escape") setSelectedShift(null);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  // loadDashboard - fetches all dashboard data with loading spinner
  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      // Redirect to login if session expired
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to load dashboard");
        toast.error(getApiErrorMessage(err, "Failed to load dashboard"));
        setDashboardData(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // loadDashboardSilent - refreshes data without showing spinner
  async function loadDashboardSilent() {
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch { /* keep previous data */ }
  }

  // ── Loading skeleton ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full space-y-6 bg-[#F8F9FC] p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:items-stretch">
          {[...Array(4)].map((_, i) => <SkeletonKpi key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="h-4 w-36 max-w-full animate-pulse rounded bg-gray-200" />
            <SkeletonDonutPlaceholder />
          </div>
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="h-4 w-36 max-w-full animate-pulse rounded bg-gray-200" />
            <SkeletonDonutPlaceholder />
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="p-3"><SkeletonList count={4} /></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-full bg-[#F8F9FC] p-6">
        <ErrorState
          title="Failed to load dashboard"
          description="Could not load dashboard data. Please try again."
          onRetry={loadDashboard}
        />
      </div>
    );
  }

  // ── Prepare chart data ─────────────────────────────────────
  const { stats, attendance, recentShifts, understaffedShifts } = dashboardData || {};

  const totalShiftCount = stats?.totalShifts ?? 0;

  // Build raw counts per donut segment from recentShifts
  const raw = { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  for (const shift of recentShifts || []) {
    const k = classifyShiftForDonut(shift);
    raw[k] += 1;
  }
  // Scale raw counts to match the total shift count from stats
  const scaled = scaleCountsToTotal(raw, totalShiftCount);

  // Shift status donut data array
  const shiftDonutData = [
    { name: "Ongoing", value: scaled.ongoing, color: SHIFT_STATUS_COLORS.ongoing },
    { name: "Upcoming", value: scaled.upcoming, color: SHIFT_STATUS_COLORS.upcoming },
    { name: "Needs staff", value: scaled.needsStaff, color: SHIFT_STATUS_COLORS.needsStaff },
    { name: "Completed", value: scaled.completed, color: SHIFT_STATUS_COLORS.completed },
  ];

  // Staff presence donut data
  const presentToday = attendance?.presentToday ?? 0;
  const lateToday = attendance?.lateToday ?? 0;
  const absentToday = attendance?.absentToday ?? 0;
  const onTime = Math.max(0, presentToday - lateToday);
  const attendanceTotal = onTime + lateToday + absentToday;
  const onTimeRate = attendanceTotal > 0 ? Math.round((onTime / attendanceTotal) * 100) : 0;

  const attendanceDonutData = [
    { name: "Present Today", value: presentToday, color: "#10b981" },
    { name: "Absent Today", value: absentToday, color: "#ef4444" },
    { name: "Late Today", value: lateToday, color: "#f59e0b" },
    { name: "On time", value: onTime, color: "#1B3F8B" },
    { name: "Total Attendance", value: attendanceTotal, color: "#1B3F8B" },
  ];

  // ── Main render ────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#F8F9FC]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:px-6 md:pt-4 lg:pb-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, here is your overview</p>
          </div>
        </div>

        {/* 4 KPI cards */}
        <DashboardStats
          totalStaff={stats?.totalEmployees ?? 0}
          upcomingShifts={stats?.upcomingCount ?? 0}
          presentRate={attendance?.rate ?? 0}
          needStaff={understaffedShifts ?? 0}
        />

        {/* 3-column layout: 2 donuts + recent activity list */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <ShiftStatusDonut
            donutData={shiftDonutData}
            totalShiftCount={totalShiftCount}
          />
          <StaffPresenceDonut
            donutData={attendanceDonutData}
            onTimeRate={onTimeRate}
            attendanceTotal={attendanceTotal}
          />
          <RecentActivityList
            recentShifts={recentShifts}
            onViewShift={(shift) => setSelectedShift(shift)}
            onViewAll={() => navigate("/manager/shifts")}
          />
        </div>
      </div>

      {/* Shift details side panel */}
      <ShiftModal shift={selectedShift} onClose={() => setSelectedShift(null)} />
    </div>
  );
};

export default ManagerDashboard;
