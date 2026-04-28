// EmployeeDashboard.jsx
// Employee home: KPI row, shift donut, attendance donut, recent shifts, shift detail modal.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  ErrorState,
  SkeletonKpi,
  SkeletonDonutPlaceholder,
  SkeletonList,
} from "@/components/ui";

import { getMyShifts, getMyRequests } from "./employeeDashboardApi";

import EmployeeStats           from "./EmployeeStats";
import MyShiftDonut            from "./MyShiftDonut";
import MyAttendanceDonut       from "./MyAttendanceDonut";
import EmployeeShiftModal      from "./EmployeeShiftModal";

import { getStatus } from "@/utils/shiftStatus";

const SHIFT_STATUS_COLORS = {
  ongoing: "#059669",
  upcoming: "#1B3F8B",
  needsStaff: "#f59e0b",
  completed: "#d1d5db",
};

const SHIFT_ROW_STATUS = {
  upcoming: {
    label: "Upcoming",
    cls: "bg-[#EFF6FF] text-[#1B3F8B]",
    dot: "bg-[#1B3F8B]",
  },
  ongoing: {
    label: "Ongoing",
    cls: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500 animate-pulse",
  },
  completed: {
    label: "Completed",
    cls: "bg-slate-100 text-gray-500",
    dot: "bg-slate-400",
  },
};

function classifyShiftForDonut(shift) {
  const s = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const open = shift.slotsAvailable ?? 0;
  if (s === "ongoing") return "ongoing";
  if (s === "completed") return "completed";
  if (s === "upcoming" && open > 0) return "needsStaff";
  if (s === "upcoming") return "upcoming";
  return "completed";
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
}

function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";
}

function listStatus(key) {
  if (key === "ongoing") return { dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800", label: "Live" };
  if (key === "upcoming") return { dot: "bg-[#1B3F8B]", pill: "bg-blue-100 text-blue-800", label: "Soon" };
  return { dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600", label: "Done" };
}

function EmployeeDashboard() {
  // My shifts data from server
  const [shifts, setShifts] = useState([]);

  // My requests data from server (kept for parity with original data-requests-loaded attr)
  const [requests, setRequests] = useState([]);

  // True while loading
  const [loading, setLoading] = useState(true);

  // Error — empty string means no error banner
  const [error, setError] = useState("");

  // Opening row for the slide-over shift modal
  const [selected, setSelected] = useState(null);

  const navigate = useNavigate();

  // loadDashboardData — fetches parallel shift + request lists identical to legacy implementation
  async function loadDashboardData() {
    setLoading(true);
    setError("");
    try {
      const [shiftList, reqList] = await Promise.all([
        getMyShifts(),
        getMyRequests(),
      ]);
      setShifts(shiftList);
      setRequests(reqList);
    } catch {
      setError("Failed to load dashboard");
      toast.error("Failed to load dashboard");
      setShifts([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  // Refresh without blocking UI — matches previous silent auto-refresh
  async function silentRefresh() {
    try {
      const [shiftList, reqList] = await Promise.all([
        getMyShifts(),
        getMyRequests(),
      ]);
      setShifts(shiftList);
      setRequests(reqList);
    } catch {
      /* keep previous dashboard */
    }
  }

  // Load everything when page opens
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Poll every minute like useAutoRefresh(60s)
  useEffect(() => {
    const id = setInterval(silentRefresh, 60_000);
    return () => clearInterval(id);
  }, []);

  // ESC closes modal
  useEffect(() => {
    const h = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) {
    return (
      <div className="min-h-full space-y-6 bg-[#F8F9FC] p-4 md:p-6">
        <div className="h-28 animate-pulse rounded-2xl bg-gray-200" aria-hidden />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <SkeletonDonutPlaceholder />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <SkeletonDonutPlaceholder />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="p-3">
                <SkeletonList count={4} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-[#F8F9FC] p-6">
        <ErrorState
          title="Failed to load dashboard"
          description="Could not load your dashboard. Please try again."
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  const totalShifts = shifts.length;
  const upcomingShifts = shifts.filter((s) => getStatus(s.shiftStartTime, s.shiftEndTime) === "upcoming").length;
  const completedShifts = shifts.filter((s) => getStatus(s.shiftStartTime, s.shiftEndTime) === "completed").length;

  const raw = { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  for (const shift of shifts) {
    raw[classifyShiftForDonut(shift)] += 1;
  }

  const shiftDonutData = [
    { name: "Ongoing", value: raw.ongoing, color: SHIFT_STATUS_COLORS.ongoing },
    { name: "Upcoming", value: raw.upcoming, color: SHIFT_STATUS_COLORS.upcoming },
    { name: "Needs staff", value: raw.needsStaff, color: SHIFT_STATUS_COLORS.needsStaff },
    { name: "Completed", value: raw.completed, color: SHIFT_STATUS_COLORS.completed },
  ];

  const present = 0;
  const late = 0;
  const absent = 0;
  const attendanceRatePct = 0;

  const recentFive = [...shifts]
    .sort((a, b) => new Date(b.shiftStartTime) - new Date(a.shiftStartTime))
    .slice(0, 5);

  return (
    <div className="min-h-full bg-[#F8F9FC]" data-requests-loaded={requests.length}>
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:px-6 md:pt-4 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Your shifts and attendance overview</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap" />
        </div>

        <EmployeeStats
          totalShifts={totalShifts}
          upcomingShifts={upcomingShifts}
          completedShifts={completedShifts}
          attendanceRate={`${attendanceRatePct}%`}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <MyShiftDonut shiftDonutData={shiftDonutData} totalShifts={totalShifts} />

          <MyAttendanceDonut
            onTimeCount={present}
            lateCount={late}
            absentCount={absent}
            attendanceRatePct={attendanceRatePct}
          />

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">My recent shifts</h2>
              <button
                type="button"
                onClick={() => navigate("/employee/myshifts")}
                className="text-sm font-medium text-[#1B3F8B] hover:underline transition-colors duration-150 active:scale-95 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-50 p-2">
              {recentFive.length > 0 ? (
                recentFive.map((shift) => {
                  const key = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                  const ls = listStatus(key);
                  const st = SHIFT_ROW_STATUS[key];
                  return (
                    <button
                      type="button"
                      key={shift._id}
                      onClick={() => setSelected(shift)}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-100 hover:bg-gray-50/80 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ls.dot}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{shift.shiftTitle}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">No recent shifts</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <EmployeeShiftModal
        shift={selected}
        onClose={() => setSelected(null)}
        onLeave={(s) => navigate("/employee/myshifts", { state: { openLeave: s._id } })}
        onChange={(s) => navigate("/employee/myshifts", { state: { openChange: s._id } })}
      />
    </div>
  );
}

export default EmployeeDashboard;
