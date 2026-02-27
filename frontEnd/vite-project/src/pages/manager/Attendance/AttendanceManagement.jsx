import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Clock, CheckCircle2, XCircle, ChevronDown, Users, CalendarDays,
  Timer, BarChart2, Download, Search, UserCheck,
  ClipboardList, TrendingUp, RefreshCw,
  LogIn, LogOut, FlaskConical, Calendar,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const GRADS = [
  "from-blue-500 to-indigo-600", "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600", "from-cyan-500 to-blue-600",
];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const initials = (n = "") => n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

/* ════════════════════════════════════════════════════════════
   AVATAR
════════════════════════════════════════════════════════════ */
const Avatar = ({ name }) => (
  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad(name)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
    {initials(name)}
  </div>
);

/* ════════════════════════════════════════════════════════════
   STAT STRIP CARD  (compact horizontal)
════════════════════════════════════════════════════════════ */
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 min-w-0">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{label}</p>
      <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">{value}</p>
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
    not_checked_in: { label: "Absent", cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200", dot: "bg-slate-400" },
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
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          {selected ? (
            <span className="truncate">
              <span className="font-semibold text-slate-800">{selected.shiftTitle}</span>
              <span className="text-slate-400 ml-2">{fmtDate(selected.shiftStartTime)} · {fmtTime(selected.shiftStartTime)}</span>
            </span>
          ) : <span className="text-slate-400">Select a shift…</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-auto">
            {shifts.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-400 text-center">No shifts found</p>
            ) : shifts.map((s) => (
              <button
                key={s._id}
                onClick={() => { onChange(s._id); setOpen(false); }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 ${value === s._id ? "bg-indigo-50" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${value === s._id ? "text-indigo-700" : "text-slate-800"}`}>{s.shiftTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(s.shiftStartTime)} · {fmtTime(s.shiftStartTime)} — {fmtTime(s.shiftEndTime)}</p>
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
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${grad(selected.username)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                {initials(selected.username)}
              </div>
              <span className="font-semibold text-slate-800 truncate">{selected.username}</span>
              <span className="text-slate-400 text-xs truncate">{selected.email}</span>
            </>
          ) : <span className="flex items-center gap-2 text-slate-400"><Users className="w-4 h-4" />Select employee…</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl">
            <div className="p-2.5 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div className="max-h-56 overflow-auto">
              {filtered.length === 0
                ? <p className="px-4 py-3 text-sm text-slate-400 text-center">No employees found</p>
                : filtered.map((e) => (
                  <button key={e._id} onClick={() => { onChange(e._id); setOpen(false); setSearch(""); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 ${value === e._id ? "bg-indigo-50" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad(e.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials(e.username)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${value === e._id ? "text-indigo-700" : "text-slate-800"}`}>{e.username}</p>
                      <p className="text-xs text-slate-400 truncate">{e.email}</p>
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
          <h3 className="text-lg font-bold text-slate-900">{isIn ? "Record Check-In" : "Record Check-Out"}</h3>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">{employeeName}</p>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {isIn ? "Check-In Date & Time" : "Check-Out Date & Time"}
            </label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition bg-slate-50 text-slate-800 font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-sm">
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
const AttendanceTab = ({ shifts }) => {
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [attendance, setAttendance] = useState({ attendance: [], acceptedEmployees: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [timePicker, setTimePicker] = useState(null);

  useEffect(() => { if (selectedShiftId) fetchAttendance(); }, [selectedShiftId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/manager/shifts/attendance/shift/${selectedShiftId}`,
        { withCredentials: true }
      );
      setAttendance(res.data.data || { attendance: [], acceptedEmployees: [] });
    } catch { toast.error("Failed to load attendance"); }
    finally { setLoading(false); }
  };

  const handleCheckIn = (id, name) => setTimePicker({ mode: "checkIn", employeeId: id, employeeName: name, defaultTime: new Date() });
  const handleCheckOut = (id, name) => setTimePicker({ mode: "checkOut", employeeId: id, employeeName: name, defaultTime: new Date() });

  const confirmCheckIn = async (iso) => {
    try {
      await axios.post("http://localhost:5000/api/manager/shifts/attendance/check-in",
        { shiftId: selectedShiftId, employeeId: timePicker.employeeId, checkInTime: iso },
        { withCredentials: true });
      toast.success(`Check-in at ${new Date(iso).toLocaleTimeString()}`);
      setTimePicker(null); fetchAttendance();
    } catch (e) { toast.error(e.response?.data?.error || "Check-in failed"); }
  };
  const confirmCheckOut = async (iso) => {
    try {
      const res = await axios.post("http://localhost:5000/api/manager/shifts/attendance/check-out",
        { shiftId: selectedShiftId, employeeId: timePicker.employeeId, checkOutTime: iso },
        { withCredentials: true });
      toast.success(`Checked out — ${res.data.data?.totalHours ?? 0}h logged`);
      setTimePicker(null); fetchAttendance();
    } catch (e) { toast.error(e.response?.data?.error || "Check-out failed"); }
  };

  const getStatus = (empId) => {
    const rec = attendance.attendance.find((a) => {
      const id = a.employee?._id || a.employee;
      return id === empId || id?.toString() === empId?.toString();
    });
    if (!rec) return "not_checked_in";
    return rec.checkOut && new Date(rec.checkOut).getTime() !== new Date(rec.checkIn).getTime()
      ? "checked_out" : "checked_in";
  };

  const selectedShift = shifts.find((s) => s._id === selectedShiftId);
  const accepted = attendance.acceptedEmployees || [];
  const records = attendance.attendance || [];
  const filtered = useMemo(() => accepted.filter((e) =>
    e.username.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  ), [accepted, search]);

  const present = accepted.filter((e) => getStatus(e._id) !== "not_checked_in").length;
  const absent = accepted.length - present;
  const completed = accepted.filter((e) => getStatus(e._id) === "checked_out").length;
  const totalHours = records.filter((r) => r.totalHours).reduce((s, r) => s + r.totalHours, 0);

  return (
    <div className="space-y-5">

      {/* ── Shift selector card ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select Shift</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <ShiftSelect shifts={shifts} value={selectedShiftId} onChange={setSelectedShiftId} />
          </div>
          {selectedShiftId && (
            <div className="flex gap-2 shrink-0">
              <button onClick={fetchAttendance}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={() => exportAttendanceCSV(selectedShift, accepted, records, getStatus)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────── */}
      {selectedShiftId && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatPill icon={Users} label="Assigned" value={accepted.length} color="bg-indigo-500" />
          <StatPill icon={CheckCircle2} label="Present" value={present} color="bg-emerald-500" />
          <StatPill icon={XCircle} label="Absent" value={absent} color="bg-rose-500" />
          <StatPill icon={BarChart2} label="Hrs Logged" value={`${Math.round(totalHours * 10) / 10}h`} color="bg-amber-500" />
        </div>
      )}

      {/* ── Attendance table card ─────────────────────────────── */}
      {selectedShiftId && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Employee Attendance</h2>
              {selectedShift && (
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />
                  {selectedShift.shiftTitle} · {fmtDate(selectedShift.shiftStartTime)} · {fmtTime(selectedShift.shiftStartTime)}–{fmtTime(selectedShift.shiftEndTime)}
                </p>
              )}
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search employees…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <Sk key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <UserCheck className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-500">
                {accepted.length === 0 ? "No employees accepted this shift yet" : "No results for your search"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {accepted.length === 0 ? "Employees will appear once they accept the shift." : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Employee", "Status", "Check-In", "Check-Out", "Hours", "Action"].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((emp) => {
                    const status = getStatus(emp._id);
                    const rec = records.find((a) => {
                      const id = a.employee?._id || a.employee;
                      return id === emp._id || id?.toString() === emp._id?.toString();
                    });
                    const outValid = rec?.checkOut &&
                      new Date(rec.checkOut).getTime() !== new Date(rec.checkIn).getTime();

                    return (
                      <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Employee */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={emp.username} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{emp.username}</p>
                              <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>
                        {/* Check-In */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {rec?.checkIn
                            ? <span className="text-sm font-medium text-slate-700">{fmtTime(rec.checkIn)}</span>
                            : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                        {/* Check-Out */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {outValid
                            ? <span className="text-sm font-medium text-slate-700">{fmtTime(rec.checkOut)}</span>
                            : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                        {/* Hours */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {rec?.totalHours
                            ? <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                              <Timer className="w-3 h-3" />{rec.totalHours}h
                            </span>
                            : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                        {/* Action */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          {status === "not_checked_in" && (
                            <button onClick={() => handleCheckIn(emp._id, emp.username)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
                              <LogIn className="w-3.5 h-3.5" /> Check In
                            </button>
                          )}
                          {status === "checked_in" && (
                            <button onClick={() => handleCheckOut(emp._id, emp.username)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition">
                              <LogOut className="w-3.5 h-3.5" /> Check Out
                            </button>
                          )}
                          {status === "checked_out" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Done
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-slate-600">{accepted.length}</span> employees
              </p>
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-emerald-600">{completed}</span> completed · <span className="font-semibold text-rose-500">{absent}</span> absent
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!selectedShiftId && (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <CalendarDays className="h-7 w-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No shift selected</p>
          <p className="text-sm text-slate-400 mt-1">Choose a shift above to view and manage attendance.</p>
        </div>
      )}

      {timePicker && (
        <TimePickerModal
          mode={timePicker.mode}
          employeeName={timePicker.employeeName}
          defaultTime={timePicker.defaultTime}
          onConfirm={timePicker.mode === "checkIn" ? confirmCheckIn : confirmCheckOut}
          onClose={() => setTimePicker(null)}
        />
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

  useEffect(() => {
    axios.get("http://localhost:5000/api/manager/shifts/employees", { withCredentials: true })
      .then((r) => setEmployees(r.data.data || []))
      .catch(() => toast.error("Failed to load employees"))
      .finally(() => setEmpLoading(false));
  }, []);

  const generate = async () => {
    if (!selectedEmpId) return toast.error("Select an employee first");
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await axios.get(
        `http://localhost:5000/api/manager/shifts/employees/${selectedEmpId}/attendance?${params}`,
        { withCredentials: true }
      );
      setData(res.data.data || null);
    } catch { toast.error("Failed to load timesheet"); }
    finally { setLoading(false); }
  };

  const history = data?.attendanceHistory || [];
  const totalHours = history.reduce((s, r) => s + (r.totalHours || 0), 0);
  const avgHours = history.length ? totalHours / history.length : 0;

  return (
    <div className="space-y-5">

      {/* ── Filter card ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Timesheet Filters</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="lg:col-span-2">
            {empLoading
              ? <Sk className="h-11 w-full" />
              : <EmployeeSelect employees={employees} value={selectedEmpId} onChange={setSelectedEmpId} />}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white text-slate-700 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white text-slate-700 transition" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generate} disabled={!selectedEmpId || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
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

      {/* ── KPI strip ────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatPill icon={CalendarDays} label="Shifts Worked" value={history.length} color="bg-indigo-500" />
          <StatPill icon={Timer} label="Total Hours" value={`${Math.round(totalHours * 10) / 10}h`} color="bg-emerald-500" />
          <StatPill icon={TrendingUp} label="Avg / Shift" value={`${Math.round(avgHours * 10) / 10}h`} color="bg-violet-500" />
          <StatPill icon={UserCheck} label="Employee" value={data.employee?.username ?? "—"} color="bg-amber-500" />
        </div>
      )}

      {/* ── Timesheet table ────────────────────────────────────── */}
      {data && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Timesheet Records</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.employee?.username}
                {(startDate || endDate) &&
                  ` · ${startDate ? fmtDate(startDate) : "All"} → ${endDate ? fmtDate(endDate) : "Now"}`}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              {history.length} record{history.length !== 1 ? "s" : ""}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No records found</p>
              <p className="text-xs text-slate-400 mt-1">No attendance data for the selected range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["#", "Shift", "Date", "Check-In", "Check-Out", "Hours"].map((h, i) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
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
                          <span className="text-xs font-semibold text-slate-300 tabular-nums">#{String(idx + 1).padStart(2, "0")}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
                              <CalendarDays className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{rec.shiftTitle}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-sm font-medium text-slate-700">{fmtDate(rec.shiftDate)}</p>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{fmtTime(rec.checkIn)}</span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {outValid
                            ? <span className="text-sm font-medium text-slate-700">{fmtTime(rec.checkOut)}</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg"><Clock className="w-3 h-3" />In Progress</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {rec.totalHours
                            ? <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg"><Timer className="w-3 h-3" />{rec.totalHours}h</span>
                            : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Total row */}
                <tfoot>
                  <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                    <td colSpan={5} className="px-5 py-3.5">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Grand Total</span>
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
          )}
        </div>
      )}

      {/* empty prompt */}
      {!data && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ClipboardList className="h-7 w-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No timesheet generated</p>
          <p className="text-sm text-slate-400 mt-1">Select an employee and click Generate.</p>
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

  useEffect(() => {
    axios.get("http://localhost:5000/api/manager/shifts?limit=200", { withCredentials: true })
      .then((r) => setShifts(r.data.data || []))
      .catch(() => toast.error("Failed to load shifts"))
      .finally(() => setShiftsLoading(false));
  }, []);

  const activeTabCfg = TABS.find((t) => t.key === activeTab);

  return (
    <div className="min-h-full bg-slate-50">

      {/* ── Page header ─────────────────────────────────────────
          Clean white header — no gradient, no colour clash
      ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 md:px-8 pt-6 pb-0">
        <div className="max-w-6xl mx-auto">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Attendance & Timesheet</h1>
              </div>
              <p className="text-sm text-slate-500 ml-0.5">
                Track employee check-ins, check-outs and generate detailed timesheets.
              </p>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full self-start sm:self-auto shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">Live Tracking</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border border-b-0 transition-all duration-150 ${activeTab === tab.key
                    ? "bg-slate-50 border-slate-200 text-indigo-700 border-b-slate-50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/60"
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
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-6">

        {/* Active tab description */}
        <div className="flex items-center gap-2 mb-5 text-xs text-slate-400">
          {activeTabCfg && <activeTabCfg.icon className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{activeTabCfg?.desc}</span>
        </div>

        {shiftsLoading ? (
          <div className="space-y-4">
            <Sk className="h-20 w-full" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Sk key={i} className="h-20" />)}</div>
            <Sk className="h-64 w-full" />
          </div>
        ) : activeTab === "attendance"
          ? <AttendanceTab shifts={shifts} />
          : <TimesheetTab />}
      </div>
    </div>
  );
};

export default AttendanceManagement;
