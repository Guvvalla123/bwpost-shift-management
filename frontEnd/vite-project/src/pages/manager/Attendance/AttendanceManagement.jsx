import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  Clock, CheckCircle2, XCircle, ChevronDown, Users, CalendarDays,
  Timer, BarChart2, Download, Search, UserCheck,
  ClipboardList, TrendingUp, RefreshCw,
  LogIn, LogOut, FlaskConical, Calendar, Loader2,
  Briefcase, FileText, X,
} from "lucide-react";
import { SkeletonTable, SkeletonList, SkeletonKpi, EmptyState, ErrorState, KpiCard, DonutChart } from "@/components/ui";


/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const GRADS = [
  "from-blue-500 to-[#162d5e]", "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600", "from-cyan-500 to-blue-600",
];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const initials = (n = "") => n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

/* ════════════════════════════════════════════════════════════
   AVATAR
════════════════════════════════════════════════════════════ */
const Avatar = ({ name }) => (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3F8B] text-xs font-bold text-white shadow-sm">
    {initials(name)}
  </div>
);

function attendanceBorderClass(status) {
  if (status === "checked_in") return "border-l-green-500";
  if (status === "checked_out") return "border-l-gray-300";
  if (status === "on_break") return "border-l-amber-500";
  return "border-l-gray-200";
}

/* ════════════════════════════════════════════════════════════
   STAT STRIP CARD  (compact horizontal)
════════════════════════════════════════════════════════════ */
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 min-w-0">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{label}</p>
      <p className="text-xl font-bold text-gray-900 tabular-nums leading-tight mt-0.5">{value}</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const cfg = {
    checked_out: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    checked_in: { label: "In Progress", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-500 animate-pulse" },
    on_break: { label: "On Break", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-500 animate-pulse" },
    not_started: { label: "Not Started", cls: "bg-slate-100 text-gray-500 ring-1 ring-gray-200", dot: "bg-slate-400" },
    not_checked_in: { label: "Not Started", cls: "bg-slate-100 text-gray-500 ring-1 ring-gray-200", dot: "bg-slate-400" },
  }[status] ?? { label: "Unknown", cls: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ════════════════════════════════════════════════════════════
   CUSTOM SHIFT DROPDOWN
════════════════════════════════════════════════════════════ */
const ShiftSelect = ({ shifts, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = shifts.find((s) => s._id === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 transition-all shadow-sm"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          {selected ? (
            <span className="truncate">
              <span className="font-semibold text-gray-800">{selected.shiftTitle}</span>
              <span className="text-gray-400 ml-2">{fmtDate(selected.shiftStartTime)} · {fmtTime(selected.shiftStartTime)}</span>
            </span>
          ) : <span className="text-gray-400">Select a shift…</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-72 overflow-auto">
            {shifts.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400 text-center">No shifts found</p>
            ) : shifts.map((s) => (
              <button
                key={s._id}
                onClick={() => { onChange(s._id); setOpen(false); }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#EFF6FF] transition-colors border-b border-slate-50 last:border-0 ${value === s._id ? "bg-[#EFF6FF]" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${value === s._id ? "text-[#1B3F8B]" : "text-gray-800"}`}>{s.shiftTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(s.shiftStartTime)} · {fmtTime(s.shiftStartTime)} — {fmtTime(s.shiftEndTime)}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   EMPLOYEE SEARCHABLE SELECT
════════════════════════════════════════════════════════════ */
const EmployeeSelect = ({ employees, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = employees.find((e) => e._id === value);
  const filtered = employees.filter((e) =>
    e.username.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 transition-all shadow-sm"
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${grad(selected.username)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                {initials(selected.username)}
              </div>
              <span className="font-semibold text-gray-800 truncate">{selected.username}</span>
              <span className="text-gray-400 text-xs truncate">{selected.email}</span>
            </>
          ) : <span className="flex items-center gap-2 text-gray-400"><Users className="w-4 h-4" />Select employee…</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl">
            <div className="p-2.5 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div className="max-h-56 overflow-auto">
              {filtered.length === 0
                ? <p className="px-4 py-3 text-sm text-gray-400 text-center">No employees found</p>
                : filtered.map((e) => (
                  <button key={e._id} onClick={() => { onChange(e._id); setOpen(false); setSearch(""); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#EFF6FF] transition-colors border-b border-slate-50 last:border-0 ${value === e._id ? "bg-[#EFF6FF]" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad(e.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials(e.username)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${value === e._id ? "text-[#1B3F8B]" : "text-gray-800"}`}>{e.username}</p>
                      <p className="text-xs text-gray-400 truncate">{e.email}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   TIME PICKER MODAL
════════════════════════════════════════════════════════════ */
const toLocalInput = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TimePickerModal = ({ mode, employeeName, defaultTime, onConfirm, onClose }) => {
  const [value, setValue] = useState(toLocalInput(defaultTime || new Date()));
  const isIn = mode === "checkIn";
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Coloured top strip */}
        <div className={`px-6 pt-6 pb-5 ${isIn ? "bg-emerald-50 border-b border-emerald-100" : "bg-blue-50 border-b border-blue-100"}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm ${isIn ? "bg-emerald-500" : "bg-blue-600"}`}>
            {isIn ? <LogIn className="w-5 h-5 text-white" /> : <LogOut className="w-5 h-5 text-white" />}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{isIn ? "Record Check-In" : "Record Check-Out"}</h3>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">{employeeName}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Test warning */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
            <FlaskConical className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">Manual entry</span> — for testing only. In production, biometric timestamps will be sent directly.
            </p>
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {isIn ? "Check-In Date & Time" : "Check-Out Date & Time"}
            </label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] transition bg-gray-50 text-gray-800 font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm">
              Cancel
            </button>
            <button
              onClick={() => { if (!value) return toast.error("Pick a date & time"); onConfirm(new Date(value).toISOString()); }}
              className={`flex-1 py-3 text-white font-semibold rounded-xl transition text-sm hover:opacity-90 ${isIn ? "bg-emerald-600" : "bg-blue-600"}`}>
              {isIn ? "Confirm Check-In" : "Confirm Check-Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   CSV HELPERS
════════════════════════════════════════════════════════════ */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return toast.error("No data to export");
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} exported`);
};

const exportAttendanceCSV = (shift, employees, records, getStatus) => {
  const rows = employees.map((emp) => {
    const rec = records.find((a) => {
      const id = a.employee?._id || a.employee;
      return id === emp._id || id?.toString() === emp._id?.toString();
    });
    const st = getStatus(emp._id);
    const outValid = rec?.checkOut && new Date(rec.checkOut).getTime() !== new Date(rec.checkIn).getTime();
    return {
      "Shift": shift?.shiftTitle ?? "",
      "Date": fmtDate(shift?.shiftStartTime),
      "Employee": emp.username,
      "Email": emp.email,
      "Status": st === "checked_out" ? "Completed" : st === "checked_in" ? "In Progress" : "Absent",
      "Check-In": rec?.checkIn ? fmtTime(rec.checkIn) : "-",
      "Check-Out": outValid ? fmtTime(rec.checkOut) : "-",
      "Hours": rec?.totalHours ? `${rec.totalHours}h` : "-",
    };
  });
  downloadCSV(rows, `Attendance_${shift?.shiftTitle?.replace(/\s+/g, "_")}_${fmtDate(shift?.shiftStartTime)}.csv`);
};

const exportTimesheetCSV = (emp, history) => {
  const rows = history.map((r) => {
    const outValid = r.checkOut && new Date(r.checkOut).getTime() !== new Date(r.checkIn).getTime();
    return {
      "Employee": emp?.username ?? "",
      "Email": emp?.email ?? "",
      "Shift": r.shiftTitle,
      "Date": fmtDate(r.shiftDate),
      "Check-In": fmtTime(r.checkIn),
      "Check-Out": outValid ? fmtTime(r.checkOut) : "In Progress",
      "Hours": r.totalHours ? `${r.totalHours}h` : "-",
    };
  });
  downloadCSV(rows, `Timesheet_${emp?.username?.replace(/\s+/g, "_")}.csv`);
};

/* ════════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════════ */
const Sk = ({ className }) => <div className={`bg-slate-200 animate-pulse rounded-xl ${className}`} />;

/* ════════════════════════════════════════════════════════════
   ATTENDANCE TAB
════════════════════════════════════════════════════════════ */
const AttendanceTab = ({ shifts, shiftSearch, setShiftSearch }) => {
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [attendanceData, setAttendanceData] = useState({ shift: null, attendance: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionBusy, setActionBusy] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const fetchAttendance = useCallback(async (silent = false) => {
    if (!selectedShiftId) return;
    try {
      if (!silent) setLoading(true);
      const res = await API.get(`/api/attendance/shift/${selectedShiftId}`);
      setAttendanceData(res.data.data || { shift: null, attendance: [] });
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error("Failed to load attendance");
      if (import.meta.env.DEV) console.error("Refresh error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedShiftId]);

  useEffect(() => {
    if (!selectedShiftId) return;
    fetchAttendance(false);
  }, [selectedShiftId, fetchAttendance]);

  const fetchAttendanceSilent = useCallback(() => {
    fetchAttendance(true);
  }, [fetchAttendance]);

  useAutoRefresh(fetchAttendanceSilent, 60_000, !!selectedShiftId);

  /* ── Action helpers ── */
  const doAction = async (endpoint, empId, extra = {}) => {
    setActionBusy(empId);
    try {
      await API.post(endpoint, { shiftId: selectedShiftId, employeeId: empId, ...extra });
      await fetchAttendance(true);
    } catch (e) { toast.error(getApiErrorMessage(e, "Action failed")); }
    finally { setActionBusy(null); }
  };

  const handleCheckIn = (empId) => doAction("/api/attendance/checkin", empId);
  const handleCheckOut = (empId) => doAction("/api/attendance/checkout", empId);
  const handleStartBreak = (empId, type) => doAction("/api/attendance/break/start", empId, { type });
  const handleEndBreak = (empId) => doAction("/api/attendance/break/end", empId);

  const shiftFromApi = attendanceData.shift;
  const selectedShift = shiftFromApi || shifts.find((s) => s._id === selectedShiftId);
  const records = attendanceData.attendance || [];

  const filtered = useMemo(() => records.filter((r) => {
    const name = r.employee?.username?.toLowerCase() || "";
    const email = r.employee?.email?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  }), [records, search]);

  /* KPI counts */
  const present = records.filter(r => r.status !== "not_started").length;
  const absent = records.filter(r => r.status === "not_started").length;
  const completed = records.filter(r => r.status === "checked_out").length;
  const onBreak = records.filter(r => r.status === "on_break").length;
  const totalMins = records.reduce((s, r) => s + (r.totalWorkMinutes || 0), 0);

  const fmtMins = (m) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`;

  const lateOnly = records.filter((r) => r.isLate && r.status !== "not_started").length;
  const presentOnTime = records.filter((r) => r.status !== "not_started" && !r.isLate).length;
  const donutAttendanceData = [
    { name: "Present", value: presentOnTime, color: "#1B3F8B" },
    { name: "Late", value: lateOnly, color: "#f59e0b" },
    { name: "Absent", value: absent, color: "#ef4444" },
  ];
  const donutTotalToday = records.length;

  const formatWorkDuration = (mins) => {
    if (mins == null || Number.isNaN(mins)) return "—";
    const m = Math.max(0, Math.round(mins));
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h === 0) return `${r}m`;
    return r === 0 ? `${h}h` : `${h}h ${r}m`;
  };

  return (
    <div className="space-y-5">

      {/* ── Shift selector ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Shift</p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search shifts..."
            value={shiftSearch}
            onChange={(e) => setShiftSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-[#1B3F8B] transition"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <ShiftSelect shifts={shifts} value={selectedShiftId} onChange={setSelectedShiftId} />
          </div>
          {selectedShiftId && (
            <button
              onClick={() => {
                const rows = records.map(r => ({
                  Employee: r.employee?.username,
                  Email: r.employee?.email,
                  Status: r.status,
                  "Work Mins": r.totalWorkMinutes,
                  "Break Mins": r.totalBreakMinutes,
                  "Late?": r.isLate ? `Yes (+${r.lateByMins}min)` : "No",
                  "Left Early?": r.leftEarly ? "Yes" : "No",
                }));
                downloadCSV(rows, `Attendance_${selectedShift?.shiftTitle?.replace(/\s+/g, "_")}.csv`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-1 shrink-0">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* ── Shift Details card (full context when shift selected) ── */}
      {selectedShiftId && loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-slate-100 px-6 py-5 animate-pulse">
            <Sk className="h-5 w-32" />
            <Sk className="h-3 w-48 mt-2" />
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Sk className="h-3 w-20" />
                <Sk className="h-4 w-full" />
                <Sk className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedShiftId && !loading && shiftFromApi && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#1B3F8B] via-[#2563EB] to-blue-600 px-6 py-5">
            <h2 className="text-lg font-bold text-white">Shift Details</h2>
            <p className="text-indigo-100 text-sm mt-0.5">Complete overview of the selected shift</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Shift name & timing */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Shift
                </p>
                <p className="text-base font-bold text-gray-900">{shiftFromApi.shiftTitle}</p>
                <p className="text-sm text-gray-600">
                  {fmtTime(shiftFromApi.shiftStartTime)} – {fmtTime(shiftFromApi.shiftEndTime)}
                </p>
              </div>
              {/* Date */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </p>
                <p className="text-base font-semibold text-gray-800">{fmtDate(shiftFromApi.shiftStartTime)}</p>
              </div>
              {/* Manager */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Manager
                </p>
                {shiftFromApi.manager ? (
                  <>
                    <p className="text-base font-semibold text-gray-800">{shiftFromApi.manager.username}</p>
                    <p className="text-xs text-gray-500 truncate">{shiftFromApi.manager.email}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              {/* Employees assigned */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Employees Assigned
                </p>
                <p className="text-base font-bold text-gray-900">{records.length}</p>
                <p className="text-xs text-gray-500">
                  {records.filter(r => r.status !== "not_started").length} present · {records.filter(r => r.status === "not_started").length} not started
                </p>
              </div>
            </div>
            {shiftFromApi.shiftNotes && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5" /> Notes
                </p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  {shiftFromApi.shiftNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPI row + donut ── */}
      {selectedShiftId && !loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-8">
            <KpiCard variant="green" icon={CheckCircle2} label="Present" value={presentOnTime} />
            <KpiCard variant="amber" icon={Timer} label="Late" value={lateOnly} />
            <KpiCard variant="red" icon={XCircle} label="Absent" value={absent} />
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-4">
            <p className="mb-2 text-center text-xs font-medium text-gray-500">Today&apos;s attendance</p>
            <DonutChart
              data={donutAttendanceData}
              size={112}
              centerValue={String(donutTotalToday)}
              centerLabel="today"
            />
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {selectedShiftId && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Employee Attendance</h2>
              {selectedShift && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />
                  {selectedShift.shiftTitle} · {fmtDate(selectedShift.shiftStartTime)} · {fmtTime(selectedShift.shiftStartTime)}–{fmtTime(selectedShift.shiftEndTime)}
                </p>
              )}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search employees…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
                aria-label="Search employees"
              />
              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <SkeletonTable rows={6} cols={6} />
              </div>
              <div className="md:hidden">
                <SkeletonList count={5} />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={records.length === 0 ? "No attendance records" : "No matching employees"}
              description={
                records.length === 0
                  ? "Attendance records will appear when employees check in."
                  : "Try a different search term."
              }
            />
          ) : (
            <>
              <div className="md:hidden space-y-3 px-4 pb-4">
                {filtered.map((rec) => {
                  const emp = rec.employee || {};
                  const busy = actionBusy === emp._id;
                  const firstIn = rec.workSessions?.[0]?.checkIn;
                  const lastOut = rec.workSessions?.[rec.workSessions.length - 1]?.checkOut;
                  const timeOpts = { hour: "2-digit", minute: "2-digit" };
                  const checkInDisp = firstIn
                    ? new Date(firstIn).toLocaleTimeString("en-DE", timeOpts)
                    : null;
                  const checkOutDisp = lastOut
                    ? new Date(lastOut).toLocaleTimeString("en-DE", timeOpts)
                    : null;
                  const workMins = rec.totalWorkMinutes || 0;
                  return (
                    <div
                      key={emp._id}
                      className={`rounded-2xl border border-gray-100 border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${attendanceBorderClass(rec.status)}`}
                    >
                      {/* TOP ROW: avatar + name + shift name */}
                      <div className="mb-3 flex items-center gap-3">
                        <Avatar name={emp.username || "?"} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{emp.username || "Employee"}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{selectedShift?.shiftTitle || "Shift"}</p>
                        </div>
                      </div>

                      {/* SECOND ROW: check in + check out with clock icons */}
                      <div className="mb-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="text-gray-400 text-xs w-14 shrink-0">Check in</span>
                          <span className="font-medium">{checkInDisp ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="text-gray-400 text-xs w-14 shrink-0">Check out</span>
                          <span className={`font-medium ${!checkOutDisp ? "text-gray-400 italic text-xs" : ""}`}>
                            {checkOutDisp ?? "Still working"}
                          </span>
                        </div>
                      </div>

                      {/* THIRD ROW: duration + flag badges */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {formatWorkDuration(workMins)} worked
                        </span>
                        {rec.isLate && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                            Late
                          </span>
                        )}
                        {rec.leftEarly && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                            Left Early
                          </span>
                        )}
                      </div>

                      {/* BOTTOM ROW: status badge + action buttons */}
                      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-end">
                          <StatusBadge status={rec.status || "not_started"} />
                        </div>
                        {rec.status === "not_started" && (
                          <button type="button" onClick={() => handleCheckIn(emp._id)} disabled={busy}
                            className="w-full min-h-11 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30">
                            <LogIn className="w-4 h-4" /> Check In
                          </button>
                        )}
                        {rec.status === "checked_in" && (
                          <>
                            <button type="button" onClick={() => handleStartBreak(emp._id, "short_break")} disabled={busy}
                              className="w-full min-h-11 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30">Break</button>
                            <button type="button" onClick={() => handleStartBreak(emp._id, "lunch")} disabled={busy}
                              className="w-full min-h-11 rounded-xl text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 disabled:opacity-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30">Lunch</button>
                            <button type="button" onClick={() => handleCheckOut(emp._id)} disabled={busy}
                              className="w-full min-h-11 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
                              <LogOut className="w-4 h-4" /> Out
                            </button>
                          </>
                        )}
                        {rec.status === "on_break" && (
                          <button type="button" onClick={() => handleEndBreak(emp._id)} disabled={busy}
                            className="w-full min-h-11 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30">Resume</button>
                        )}
                        {rec.status === "checked_out" && (
                          <span className="text-xs text-center text-gray-500 py-1 inline-flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed
                          </span>
                        )}
                        {busy && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Employee", "Status", "Sessions", "Work", "Break", "Flags", "Action"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((rec) => {
                    const emp = rec.employee || {};
                    const busy = actionBusy === emp._id;

                    /* first check-in / last check-out */
                    const firstIn = rec.workSessions?.[0]?.checkIn;
                    const lastOut = rec.workSessions?.[rec.workSessions.length - 1]?.checkOut;

                    return (
                      <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors duration-100">
                        {/* Employee */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={emp.username || "?"} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{emp.username}</p>
                              <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={rec.status || "not_started"} />
                        </td>

                        {/* Sessions: first in → last out */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-xs">
                            {firstIn
                              ? <span className="text-emerald-600 font-medium">{fmtTime(firstIn)}</span>
                              : <span className="text-gray-300">—</span>}
                            {lastOut && (
                              <> <span className="text-gray-300">→</span> <span className="text-blue-600 font-medium">{fmtTime(lastOut)}</span></>
                            )}
                            {rec.workSessions?.length > 1 && (
                              <span className="ml-1 text-[10px] bg-slate-100 text-gray-500 px-1 rounded">{rec.workSessions.length} sessions</span>
                            )}
                          </div>
                        </td>

                        {/* Work time */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {rec.totalWorkMinutes > 0
                            ? <span className="inline-flex items-center gap-1 text-sm font-bold text-[#1B3F8B] bg-[#EFF6FF] px-2 py-0.5 rounded-lg">
                              <Timer className="w-3 h-3" />{fmtMins(rec.totalWorkMinutes)}
                            </span>
                            : <span className="text-gray-300 text-sm">—</span>}
                        </td>

                        {/* Break time */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {rec.totalBreakMinutes > 0
                            ? <span className="text-xs font-semibold text-amber-600">{fmtMins(rec.totalBreakMinutes)}</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>

                        {/* Flags: late / left early */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            {rec.isLate && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                Late +{rec.lateByMins}m
                              </span>
                            )}
                            {rec.leftEarly && (
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">
                                Left Early
                              </span>
                            )}
                            {rec.overtimeMinutes > 0 && (
                              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded">
                                OT +{fmtMins(rec.overtimeMinutes)}
                              </span>
                            )}
                            {!rec.isLate && !rec.leftEarly && rec.overtimeMinutes === 0 && (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {rec.status === "not_started" && (
                              <button onClick={() => handleCheckIn(emp._id)} disabled={busy}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50">
                                <LogIn className="w-3 h-3" /> Check In
                              </button>
                            )}
                            {rec.status === "checked_in" && (<>
                              <button onClick={() => handleStartBreak(emp._id, "short_break")} disabled={busy}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition disabled:opacity-50">
                                Break
                              </button>
                              <button onClick={() => handleStartBreak(emp._id, "lunch")} disabled={busy}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition disabled:opacity-50">
                                Lunch
                              </button>
                              <button onClick={() => handleCheckOut(emp._id)} disabled={busy}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-50">
                                <LogOut className="w-3 h-3" /> Out
                              </button>
                            </>)}
                            {rec.status === "on_break" && (
                              <button onClick={() => handleEndBreak(emp._id)} disabled={busy}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50 animate-pulse">
                                Resume
                              </button>
                            )}
                            {rec.status === "checked_out" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-400 bg-slate-100 rounded-lg">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Done
                              </span>
                            )}
                            {busy && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin ml-1" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="px-5 py-3 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{filtered.length}</span> employees · auto-refreshes every 30s
                </p>
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-emerald-600">{completed}</span> completed ·{" "}
                  <span className="font-semibold text-amber-500">{onBreak}</span> on break ·{" "}
                  <span className="font-semibold text-rose-500">{absent}</span> not started
                </p>
              </div>
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

      {!selectedShiftId && (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <CalendarDays className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-600">Please select a shift to view details</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm text-center">
            Choose a shift from the dropdown above to see shift details, assigned manager, employees, and attendance status.
          </p>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   TIMESHEET TAB
════════════════════════════════════════════════════════════ */
const TimesheetTab = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empLoading, setEmpLoading] = useState(true);
  const [empSearch, setEmpSearch] = useState("");
  const debouncedEmpSearch = useDebounce(empSearch, 400);
  const [timesheetFetchError, setTimesheetFetchError] = useState(false);

  useEffect(() => {
    setEmpLoading(true);
    const params = new URLSearchParams({ limit: "20", page: "1" });
    if (debouncedEmpSearch) params.set("search", debouncedEmpSearch);
    API.get(`/api/manager/shifts/employees?${params}`)
      .then((r) => setEmployees(r.data.data || []))
      .catch(() => toast.error("Failed to load employees"))
      .finally(() => setEmpLoading(false));
  }, [debouncedEmpSearch]);

  const fetchTimesheet = useCallback(async () => {
    if (!selectedEmpId) return toast.error("Select an employee first");
    try {
      setLoading(true);
      setTimesheetFetchError(false);
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await API.get(
        `/api/manager/shifts/employees/${selectedEmpId}/attendance?${params}`
      );
      setData(res.data.data || null);
    } catch {
      setTimesheetFetchError(true);
      setData(null);
      toast.error("Failed to load timesheet");
    } finally { setLoading(false); }
  }, [selectedEmpId, startDate, endDate]);

  const history = data?.attendanceHistory || [];
  const totalHours = history.reduce((s, r) => s + (r.totalHours || 0), 0);
  const avgHours = history.length ? totalHours / history.length : 0;

  return (
    <div className="space-y-5">

      {/* ── Filter card ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Timesheet Filters</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="lg:col-span-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees to load…"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] bg-white text-gray-700 transition"
              />
            </div>
            {empLoading
              ? <Sk className="h-11 w-full" />
              : <EmployeeSelect employees={employees} value={selectedEmpId} onChange={setSelectedEmpId} />}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] bg-white text-gray-700 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] bg-white text-gray-700 transition" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTimesheet} disabled={!selectedEmpId || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#1B3F8B] rounded-xl hover:bg-[#162d5e] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Search className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Timesheet"}
          </button>
          {data && history.length > 0 && (
            <button onClick={() => exportTimesheetCSV(data.employee, history)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {timesheetFetchError && !loading && (
        <div className="p-6">
          <ErrorState
            title="Failed to load timesheet"
            description="Could not fetch attendance data. Please try again."
            onRetry={fetchTimesheet}
          />
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="hidden md:block">
            <SkeletonTable rows={5} cols={6} />
          </div>
          <div className="md:hidden">
            <SkeletonList count={4} />
          </div>
        </div>
      )}

      {/* ── KPI strip ────────────────────────────────────────── */}
      {data && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatPill icon={CalendarDays} label="Shifts Worked" value={history.length} color="bg-[#2563EB]" />
          <StatPill icon={Timer} label="Total Hours" value={`${Math.round(totalHours * 10) / 10}h`} color="bg-emerald-500" />
          <StatPill icon={TrendingUp} label="Avg / Shift" value={`${Math.round(avgHours * 10) / 10}h`} color="bg-violet-500" />
          <StatPill icon={UserCheck} label="Employee" value={data.employee?.username ?? "—"} color="bg-amber-500" />
        </div>
      )}

      {/* ── Timesheet table ────────────────────────────────────── */}
      {data && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Timesheet Records</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {data.employee?.username}
                {(startDate || endDate) &&
                  ` · ${startDate ? fmtDate(startDate) : "All"} → ${endDate ? fmtDate(endDate) : "Now"}`}
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-slate-100 px-3 py-1.5 rounded-full">
              {history.length} record{history.length !== 1 ? "s" : ""}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-500">No records found</p>
              <p className="text-xs text-gray-400 mt-1">No attendance data for the selected range.</p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3 px-4 pb-4">
                {history.map((rec, idx) => {
                  const outValid = rec.checkOut &&
                    new Date(rec.checkOut).getTime() !== new Date(rec.checkIn).getTime();
                  return (
                    <div key={rec.shiftId || idx} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-gray-900 text-sm flex-1">{rec.shiftTitle}</p>
                        <span className="text-xs text-gray-400 shrink-0">#{String(idx + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{fmtDate(rec.shiftDate)}</p>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
                        <div>
                          <span className="text-gray-400">In:</span>{" "}
                          <span className="font-medium text-gray-800">{fmtTime(rec.checkIn)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Out:</span>{" "}
                          {outValid ? (
                            <span className="font-medium text-gray-800">{fmtTime(rec.checkOut)}</span>
                          ) : (
                            <span className="text-amber-600 font-medium">In progress</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Hours:</span>{" "}
                          {rec.totalHours ? (
                            <span className="font-bold text-[#1B3F8B]">{rec.totalHours}h</span>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-xl bg-[#EFF6FF] border border-indigo-100 px-4 py-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">Grand Total</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-800">
                    <Timer className="w-4 h-4" />{Math.round(totalHours * 100) / 100}h
                  </span>
                </div>
              </div>
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["#", "Shift", "Date", "Check-In", "Check-Out", "Hours"].map((h, i) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((rec, idx) => {
                    const outValid = rec.checkOut &&
                      new Date(rec.checkOut).getTime() !== new Date(rec.checkIn).getTime();
                    return (
                      <tr key={rec.shiftId || idx} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-gray-300 tabular-nums">#{String(idx + 1).padStart(2, "0")}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-blue-600 flex items-center justify-center shrink-0">
                              <CalendarDays className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1B3F8B] transition-colors">{rec.shiftTitle}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-700">{fmtDate(rec.shiftDate)}</p>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">{fmtTime(rec.checkIn)}</span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {outValid
                            ? <span className="text-sm font-medium text-gray-700">{fmtTime(rec.checkOut)}</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg"><Clock className="w-3 h-3" />In Progress</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {rec.totalHours
                            ? <span className="inline-flex items-center gap-1 text-sm font-bold text-[#1B3F8B] bg-[#EFF6FF] px-2.5 py-1 rounded-lg"><Timer className="w-3 h-3" />{rec.totalHours}h</span>
                            : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Total row */}
                <tfoot>
                  <tr className="bg-[#EFF6FF] border-t-2 border-indigo-100">
                    <td colSpan={5} className="px-5 py-3.5">
                      <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">Grand Total</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-sm font-black text-indigo-800 bg-indigo-100 px-3 py-1.5 rounded-xl">
                        <Timer className="w-3.5 h-3.5" />{Math.round(totalHours * 100) / 100}h
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* empty prompt */}
      {!data && !loading && !timesheetFetchError && (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ClipboardList className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-600">No timesheet generated</p>
          <p className="text-sm text-gray-400 mt-1">Select an employee and click Generate.</p>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "attendance", label: "Attendance", icon: UserCheck, desc: "Mark check-in / check-out per shift" },
  { key: "timesheet", label: "Timesheet", icon: ClipboardList, desc: "View hours worked per employee" },
];

const AttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftSearch, setShiftSearch] = useState("");
  const debouncedShift = useDebounce(shiftSearch, 400);
  const [listDate, setListDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setShiftsLoading(true);
    const params = new URLSearchParams({ limit: "20", page: "1" });
    if (debouncedShift) params.set("search", debouncedShift);
    API.get(`/api/manager/shifts?${params}`)
      .then((r) => {
        const { data } = r.data;
        setShifts(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load shifts"))
      .finally(() => setShiftsLoading(false));
  }, [debouncedShift]);

  const shiftsForDay = useMemo(() => {
    if (!listDate) return shifts;
    const t = new Date(`${listDate}T12:00:00`);
    return shifts.filter((s) => {
      const d = new Date(s.shiftStartTime);
      return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
      );
    });
  }, [shifts, listDate]);

  const activeTabCfg = TABS.find((t) => t.key === activeTab);

  return (
    <div className="min-h-full bg-[#F8F9FC]">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-4 pb-0 pt-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-500 mt-1">Track daily team attendance</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap"></div>
          </div>

          {/* Date filter */}
          <div className="mb-5 flex w-full flex-col gap-1 sm:w-auto sm:min-w-[200px]">
            <label className="text-xs font-medium text-gray-500" htmlFor="attendance-date">
              Filter by date
            </label>
            <input
              id="attendance-date"
              type="date"
              value={listDate}
              onChange={(e) => setListDate(e.target.value)}
              className="h-11 min-h-[44px] w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 sm:w-[200px]"
            />
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border border-b-0 transition-all duration-150 ${activeTab === tab.key
                  ? "bg-gray-50 border-gray-200 text-[#1B3F8B] border-b-slate-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50/60"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8">

        {/* Active tab description */}
        <div className="mb-5 flex items-center gap-2 text-xs text-gray-400">
          {activeTabCfg && <activeTabCfg.icon className="h-3.5 w-3.5 text-indigo-400" />}
          <span>{activeTabCfg?.desc}</span>
        </div>

        {shiftsLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonKpi key={i} />
              ))}
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="hidden md:block">
                <SkeletonTable rows={4} cols={5} />
              </div>
              <div className="md:hidden">
                <SkeletonList count={4} />
              </div>
            </div>
          </div>
        ) : activeTab === "attendance" ? (
          <AttendanceTab shifts={shiftsForDay} shiftSearch={shiftSearch} setShiftSearch={setShiftSearch} />
        ) : (
          <TimesheetTab />
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;
