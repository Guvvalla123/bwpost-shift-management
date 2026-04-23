import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { toast } from "sonner";
import {
  ErrorState,
  DonutChart,
  KpiCard,
  SkeletonKpi,
  SkeletonDonutPlaceholder,
  SkeletonList,
} from "@/components/ui";
import {
  X,
  ArrowRightLeft,
  LogOut as LeaveIcon,
} from "lucide-react";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";
import { getStatus } from "@/utils/shiftStatus";
import { getDisplayName } from "@/utils/displayName";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS = {
  upcoming: { label: "Upcoming", cls: "bg-[#EFF6FF] text-[#1B3F8B]", dot: "bg-[#1B3F8B]" },
  ongoing: { label: "Ongoing", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" },
  completed: { label: "Completed", cls: "bg-slate-100 text-gray-500", dot: "bg-slate-400" },
};

const SHIFT_STATUS_COLORS = {
  ongoing: "#059669",
  upcoming: "#1B3F8B",
  needsStaff: "#f59e0b",
  completed: "#d1d5db",
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

const BannerClock = React.memo(() => {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-3 text-right backdrop-blur-sm shrink-0">
      <p className="text-white text-xl font-bold tabular-nums tracking-tight">
        {t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-white/70 text-xs mt-1">
        {t.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </p>
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden />
        <span className="text-white/50 text-xs">Live</span>
      </div>
    </div>
  );
});

function DonutLegendRows({ rows, total, valueMode = "count" }) {
  const denom = total > 0 ? total : 1;
  return (
    <ul className="w-full space-y-2">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.value / denom) * 100) : 0;
        const barPct = total > 0 ? (row.value / denom) * 100 : 0;
        return (
          <li key={row.name}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate text-sm text-gray-700">{row.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {valueMode === "percent" ? `${pct}%` : row.value}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${barPct}%`, backgroundColor: row.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const ShiftModal = ({ shift, onClose, onLeave, onChange }) => {
  if (!shift) return null;
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const st = STATUS[status];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4 sm:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white h-full w-full sm:w-[420px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>

        <div className="bg-gradient-to-br from-[#1B3F8B] via-[#1B3F8B] to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight">{shift.shiftTitle}</h2>
              <p className="text-white/70 text-sm mt-2">
                {fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors duration-150 active:scale-95 text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {shift.shiftNotes && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-gray-700 leading-relaxed">{shift.shiftNotes}</p>
          </div>
        )}

        {shift.createdByManager && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Posted By</p>
            <p className="text-sm font-semibold text-gray-700">{shift.createdByManager.username || "Manager"}</p>
          </div>
        )}

        {status === "upcoming" && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Actions</p>
            <button
              onClick={() => { onChange(shift); onClose(); }}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
            >
              <ArrowRightLeft size={15} />
              Request Shift Change
            </button>
            <button
              onClick={() => { onLeave(shift); onClose(); }}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <LeaveIcon size={15} />
              Request Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const [shifts, setShifts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      const [shiftRes, reqRes] = await Promise.all([
        API.get(`/api/employee/shifts/myshifts?${params}`),
        API.get(`/api/employee/shifts/requests?${params}`),
      ]);
      setShifts(Array.isArray(shiftRes.data?.data) ? shiftRes.data.data : []);
      setRequests(Array.isArray(reqRes.data?.data) ? reqRes.data.data : []);
    } catch {
      setFetchError(true);
      toast.error("Failed to load dashboard");
      setShifts([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardSilent = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      const [shiftRes, reqRes] = await Promise.all([
        API.get(`/api/employee/shifts/myshifts?${params}`),
        API.get(`/api/employee/shifts/requests?${params}`),
      ]);
      setShifts(Array.isArray(shiftRes.data?.data) ? shiftRes.data.data : []);
      setRequests(Array.isArray(reqRes.data?.data) ? reqRes.data.data : []);
    } catch {
      /* silent — keep previous data */
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useAutoRefresh(fetchDashboardSilent, 60_000);

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

  if (fetchError) {
    return (
      <div className="min-h-full bg-[#F8F9FC] p-6">
        <ErrorState
          title="Failed to load dashboard"
          description="Could not load your dashboard. Please try again."
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const totalShifts = shifts.length;
  const upcomingShifts = shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "upcoming").length;
  const completedShifts = shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "completed").length;

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
  const attendanceTotal = present + late + absent;
  const attendanceDonutData = [
    { name: "On time", value: present, color: "#1B3F8B" },
    { name: "Late", value: late, color: "#f59e0b" },
    { name: "Absent", value: absent, color: "#ef4444" },
  ];
  const attendanceRows = attendanceDonutData.map((d) => ({ ...d }));

  const attendanceRatePct = 0;

  const recentFive = [...shifts]
    .sort((a, b) => new Date(b.shiftStartTime) - new Date(a.shiftStartTime))
    .slice(0, 5);

  const now = new Date();
  const dayOfWeek = now.toLocaleDateString(undefined, { weekday: "long" });
  const dateLine = now.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  const listStatus = (key) => {
    if (key === "ongoing") return { dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800", label: "Live" };
    if (key === "upcoming") return { dot: "bg-[#1B3F8B]", pill: "bg-blue-100 text-blue-800", label: "Soon" };
    return { dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600", label: "Done" };
  };

  return (
    <div className="min-h-full bg-[#F8F9FC]" data-requests-loaded={requests.length}>
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:px-6 md:pt-4 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Your shifts and attendance overview</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap"></div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard variant="navy" label="My Total Shifts" value={totalShifts} />
          <KpiCard variant="default" label="Upcoming" value={upcomingShifts} />
          <KpiCard variant="green" label="Completed" value={completedShifts} />
          <KpiCard variant="amber" label="My Attendance Rate" value={`${attendanceRatePct}%`} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-gray-900">My shifts by status</h2>
            <div className="mt-3 flex flex-col items-center">
              <DonutChart
                data={shiftDonutData}
                centerValue={String(totalShifts)}
                centerLabel="total"
                size={120}
              />
              <div className="mt-2 w-full">
                <DonutLegendRows rows={shiftDonutData} total={totalShifts} valueMode="count" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-gray-900">My attendance</h2>
            <div className="mt-3 flex flex-col items-center">
              <DonutChart
                data={attendanceDonutData}
                centerValue={`${attendanceRatePct}%`}
                centerLabel="on time"
                size={120}
              />
              <div className="mt-2 w-full">
                <DonutLegendRows rows={attendanceRows} total={attendanceTotal} valueMode="percent" />
              </div>
            </div>
          </div>

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
                  const st = STATUS[key];
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

      <ShiftModal
        shift={selected}
        onClose={() => setSelected(null)}
        onLeave={(s) => navigate("/employee/myshifts", { state: { openLeave: s._id } })}
        onChange={(s) => navigate("/employee/myshifts", { state: { openChange: s._id } })}
      />
    </div>
  );
};

export default EmployeeDashboard;
