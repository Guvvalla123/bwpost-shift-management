import API from "@/api";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { DonutChart, SkeletonTable } from "@/components/ui";
import {
  Plus, CalendarDays, Clock, Trash2,
  Pencil, Search, X, AlignLeft, AlertTriangle,
  CheckCircle2, Timer, CalendarX, ChevronRight,
  UserCheck, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import CreateShiftModal from "./CreateShiftModal";
import EditShiftModal from "./EditShiftModal";

/* ─── Helpers ────────────────────────────────────────────── */
import { getStatus } from "@/utils/shiftStatus";

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", icon: Timer },
  ongoing: { label: "Ongoing", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle2 },
  completed: { label: "Completed", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", icon: CalendarX },
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const duration = (start, end) => {
  const diff = (new Date(end) - new Date(start)) / 60000; // minutes
  if (diff < 60) return `${diff}m`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
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

function scaleCountsToTotal(raw, total) {
  const keys = ["ongoing", "upcoming", "needsStaff", "completed"];
  const sum = keys.reduce((a, k) => a + raw[k], 0);
  if (total <= 0) return { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  if (sum <= 0) return { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  const scaled = keys.map((k) => Math.round((raw[k] / sum) * total));
  const diff = total - scaled.reduce((a, b) => a + b, 0);
  const maxIdx = scaled.indexOf(Math.max(...scaled));
  scaled[maxIdx] += diff;
  return { ongoing: scaled[0], upcoming: scaled[1], needsStaff: scaled[2], completed: scaled[3] };
}

function DonutLegendMini({ rows, total }) {
  const denom = total > 0 ? total : 1;
  return (
    <ul className="mt-2 w-full space-y-1.5">
      {rows.map((row) => {
        const barPct = total > 0 ? (row.value / denom) * 100 : 0;
        return (
          <li key={row.name} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-gray-600">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-gray-900">{row.value}</span>
            </div>
            <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: row.color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function mobileStatusBorder(shift) {
  const s = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const open = Number(shift.slotsAvailable) || 0;
  if (s === "ongoing") return "border-l-emerald-500";
  if (s === "completed") return "border-l-slate-300";
  if (s === "upcoming" && open > 0) return "border-l-amber-500";
  if (s === "upcoming") return "border-l-[#1B3F8B]";
  return "border-l-slate-300";
}

const FilterStatCard = ({ label, value, icon: Icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full flex-col rounded-2xl border p-4 text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 ${
      active
        ? "border-[#1B3F8B] bg-[#EFF6FF] ring-1 ring-[#1B3F8B]/20"
        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
    }`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-[#1B3F8B] text-white" : "bg-blue-50 text-[#1B3F8B]"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      </div>
    </div>
  </button>
);

/* ─── Avatar helpers ─────────────────────────────────────── */
const GRADS = [
  "from-blue-600 to-[#162d5e]", "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600", "from-cyan-500 to-blue-600",
];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const initials = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

/* ─── Shift Detail Drawer ────────────────────────────────── */
const ShiftDetailDrawer = ({ shift, onClose, onEdit, onDelete }) => {
  if (!shift) return null;

  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const cfg = STATUS_CONFIG[status];
  const accepted = shift.acceptedEmployees?.length || 0;
  const slots = shift.slotsAvailable || 1;
  const fillPct = Math.min(Math.round((accepted / slots) * 100), 100);
  const barColor = fillPct >= 100 ? "bg-emerald-500" : fillPct >= 60 ? "bg-blue-500" : "bg-amber-400";

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white h-full w-full sm:w-[440px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-[#162d5e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 text-white`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-white`} />
                {cfg.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight">{shift.shiftTitle}</h2>
              <p className="text-blue-200 text-sm mt-2">
                {fmtDate(shift.shiftStartTime)} &nbsp;·&nbsp;
                {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition text-white shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick actions inside header */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { onEdit(shift); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <Pencil size={12} /> Edit Shift
            </button>
            <button
              onClick={() => { onDelete(shift); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-white text-xs font-semibold border border-red-300/20 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {/* ── Shift Details ── */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shift Details</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={13} className="text-blue-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</p>
              </div>
              <p className="text-sm font-bold text-slate-800">{fmtDate(shift.shiftStartTime)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-[#2563EB]" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</p>
              </div>
              <p className="text-sm font-bold text-slate-800">{duration(shift.shiftStartTime, shift.shiftEndTime)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Timer size={13} className="text-violet-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start</p>
              </div>
              <p className="text-sm font-bold text-slate-800">{fmtTime(shift.shiftStartTime)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Timer size={13} className="text-teal-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End</p>
              </div>
              <p className="text-sm font-bold text-slate-800">{fmtTime(shift.shiftEndTime)}</p>
            </div>
          </div>
        </div>

        {/* ── Capacity ── */}
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Slot Capacity</p>
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-slate-900 tabular-nums">{accepted}</span>
              <span className="text-slate-400 text-lg font-medium">/{slots}</span>
              <span className="ml-2 text-xs text-slate-400">employees assigned</span>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: fillPct >= 100 ? "#10b981" : fillPct >= 60 ? "#3b82f6" : "#f59e0b" }}>
              {fillPct}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${fillPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">{slots - accepted} slot{slots - accepted !== 1 ? "s" : ""} remaining</p>
        </div>

        {/* ── Notes ── */}
        {shift.shiftNotes && (
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={13} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4">{shift.shiftNotes}</p>
          </div>
        )}

        {/* ── Accepted Employees ── */}
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Accepted Employees ({accepted})
          </p>
          {shift.acceptedEmployees?.length > 0 ? (
            <div className="space-y-2">
              {shift.acceptedEmployees.map((emp, idx) => (
                <div
                  key={emp._id || idx}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad(emp.username || "")} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm overflow-hidden`}>
                    {emp.profileImage
                      ? <img src={emp.profileImage} alt="" className="w-full h-full object-cover" />
                      : initials(emp.username || "")
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.username || "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.email || ""}</p>
                  </div>
                  <span className="text-xs text-slate-300 font-medium tabular-nums shrink-0">#{idx + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <UserCheck className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium text-slate-500">No employees yet</p>
              <p className="text-xs text-slate-400 mt-1">Employees will appear once they accept this shift.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Shift Row ──────────────────────────────────────────── */
const ShiftRow = ({ shift, onView, onEdit, onDelete }) => {
  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const accepted = shift.acceptedEmployees?.length || 0;
  const slots = shift.slotsAvailable || 1;
  const fillPct = Math.min(Math.round((accepted / slots) * 100), 100);

  return (
    <tr
      className="group cursor-pointer border-b border-slate-50 transition-colors duration-150 even:bg-slate-50/40 hover:bg-blue-50/50"
      onClick={() => onView(shift)}
    >
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-[#162d5e] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{shift.shiftTitle}</p>
            {shift.shiftNotes && (
              <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5 flex items-center gap-1">
                <AlignLeft className="w-3 h-3 shrink-0" />
                {shift.shiftNotes}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Date & Time */}
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm font-medium text-slate-800">{fmtDate(shift.shiftStartTime)}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {fmtTime(shift.shiftStartTime)} → {fmtTime(shift.shiftEndTime)}
          <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium text-[10px]">
            {duration(shift.shiftStartTime, shift.shiftEndTime)}
          </span>
        </p>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
          {status === "ongoing" ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
            </span>
          ) : (
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          )}
          {cfg.label}
        </span>
      </td>

      {/* Slots fill */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${fillPct >= 100 ? "bg-emerald-500" : fillPct >= 60 ? "bg-blue-500" : "bg-amber-400"
                }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 tabular-nums">
            {accepted}/{slots}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(shift);
            }}
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1B3F8B]"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(shift);
            }}
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#1B3F8B]"
            title="Edit shift"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(shift);
            }}
            className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
            title="Delete shift"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <ChevronRight className="ml-0.5 h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" aria-hidden />
        </div>
      </td>
    </tr>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                              */
/* ═══════════════════════════════════════════════════════════ */
const ManagerShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shiftListTotal, setShiftListTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });
  const [dashData, setDashData] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const [createShift, setCreateShift] = useState({
    shiftTitle: "", shiftStartTime: "", shiftEndTime: "",
    shiftNotes: "", slotsAvailable: "",
  });

  const filterSigRef = useRef(`${debouncedSearch}|${statusFilter}`);
  /* ── Fetch ── */
  const fetchShifts = useCallback(async (pageNum, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await API.get(`/api/manager/shifts?${params}`);
      const { data, pagination } = res.data;
      setShifts(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setShiftListTotal(pagination?.total ?? 0);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error("Failed to load shifts");
      if (import.meta.env.DEV) console.error("Refresh error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    const sig = `${debouncedSearch}|${statusFilter}`;
    const filtersChanged = filterSigRef.current !== sig;
    if (filtersChanged) filterSigRef.current = sig;
    const pageToFetch = filtersChanged ? 1 : currentPage;
    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    fetchShifts(pageToFetch, false);
  }, [currentPage, debouncedSearch, statusFilter, fetchShifts]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchShifts(currentPage, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPage, fetchShifts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchShifts(currentPage, true);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentPage, fetchShifts]);

  const fetchShiftMeta = useCallback(async () => {
    try {
      const [all, up, on, co, dash] = await Promise.all([
        API.get("/api/manager/shifts?page=1&limit=1"),
        API.get("/api/manager/shifts?page=1&limit=1&status=upcoming"),
        API.get("/api/manager/shifts?page=1&limit=1&status=ongoing"),
        API.get("/api/manager/shifts?page=1&limit=1&status=completed"),
        API.get("/api/manager/shifts/dashboard/data"),
      ]);
      setStatusCounts({
        all: all.data?.pagination?.total ?? 0,
        upcoming: up.data?.pagination?.total ?? 0,
        ongoing: on.data?.pagination?.total ?? 0,
        completed: co.data?.pagination?.total ?? 0,
      });
      setDashData(dash.data?.data ?? dash.data);
    } catch {
      /* keep previous meta on failure */
    }
  }, []);

  useEffect(() => {
    fetchShiftMeta();
  }, [fetchShiftMeta]);

  /* ── Create ── */
  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "shiftStartTime") {
      setCreateShift((prev) => {
        const next = { ...prev, shiftStartTime: value };
        if (prev.shiftEndTime && new Date(prev.shiftEndTime) <= new Date(value)) {
          next.shiftEndTime = "";
          toast.info("Please select a new end time");
        }
        return next;
      });
      return;
    }
    setCreateShift((prev) => ({ ...prev, [name]: value }));
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!createShift.shiftTitle || !createShift.shiftStartTime || !createShift.shiftEndTime || !createShift.slotsAvailable) {
      return toast.error("Please fill all required fields");
    }
    const start = new Date(createShift.shiftStartTime);
    const end = new Date(createShift.shiftEndTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return toast.error("Please select a valid start and end date and time");
    }
    if (end <= start) {
      return toast.error("End time must be after start time");
    }
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return toast.error("Shift cannot be longer than 24 hours");
    }
    try {
      await API.post("/api/manager/shifts", createShift);
      toast.success("Shift created successfully");
      setCreateShift({ shiftTitle: "", shiftStartTime: "", shiftEndTime: "", shiftNotes: "", slotsAvailable: "" });
      setShowCreate(false);
      fetchShifts(currentPage, false);
      fetchShiftMeta();
    } catch (err) { toast.error(getApiErrorMessage(err, "Failed to create shift")); }
  };

  /* ── Edit ── */
  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditingShift((prev) => {
      if (!prev) return prev;
      if (name === "shiftStartTime") {
        const next = { ...prev, shiftStartTime: value };
        if (prev.shiftEndTime && new Date(prev.shiftEndTime) <= new Date(value)) {
          next.shiftEndTime = "";
          toast.info("Please select a new end time");
        }
        return next;
      }
      return { ...prev, [name]: value };
    });
  };
  const onUpdateHandler = async (e) => {
    e.preventDefault();
    if (!editingShift) return;
    const start = new Date(editingShift.shiftStartTime);
    const end = new Date(editingShift.shiftEndTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return toast.error("Please select a valid start and end date and time");
    }
    if (end <= start) {
      return toast.error("End time must be after start time");
    }
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return toast.error("Shift cannot be longer than 24 hours");
    }
    try {
      await API.put(`/api/manager/shifts/${editingShift._id}`, editingShift);
      toast.success("Shift updated");
      setEditingShift(null);
      fetchShifts(currentPage, false);
      fetchShiftMeta();
    } catch { toast.error("Update failed"); }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/api/manager/shifts/${deleteTarget._id}`);
      toast.success("Shift deleted");
      setDeleteTarget(null);
      fetchShifts(currentPage, false);
      fetchShiftMeta();
    } catch (err) { toast.error(getApiErrorMessage(err, "Delete failed")); }
    finally { setDeleting(false); }
  };

  /* ── Filter (server returns filtered data; client filter only for instant UI before debounce) ── */
  const filteredShifts = shifts;

  const { shiftDonutData, donutTotal } = useMemo(() => {
    const d = dashData;
    if (!d) {
      return { shiftDonutData: [], donutTotal: 0 };
    }
    const { stats, recentShifts } = d;
    const totalShiftCount = stats?.totalShifts ?? 0;
    const raw = { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
    for (const shift of recentShifts || []) {
      const k = classifyShiftForDonut(shift);
      raw[k] += 1;
    }
    const scaled = scaleCountsToTotal(raw, totalShiftCount);
    const data = [
      { name: "Ongoing", value: scaled.ongoing, color: SHIFT_STATUS_COLORS.ongoing },
      { name: "Upcoming", value: scaled.upcoming, color: SHIFT_STATUS_COLORS.upcoming },
      { name: "Needs staff", value: scaled.needsStaff, color: SHIFT_STATUS_COLORS.needsStaff },
      { name: "Completed", value: scaled.completed, color: SHIFT_STATUS_COLORS.completed },
    ];
    return { shiftDonutData: data, donutTotal: totalShiftCount };
  }, [dashData]);

  const donutLegendRows = shiftDonutData.map((d) => ({
    name: d.name,
    value: d.value,
    color: d.color,
  }));

  const FILTER_TABS = [
    { key: "all", label: "All", count: statusCounts.all },
    { key: "upcoming", label: "Upcoming", count: statusCounts.upcoming },
    { key: "ongoing", label: "Ongoing", count: statusCounts.ongoing },
    { key: "completed", label: "Completed", count: statusCounts.completed },
  ];

  /* ── ESC closes everything ── */
  useEffect(() => {
    const h = (e) => {
      if (e.key !== "Escape") return;
      if (selectedShift) { setSelectedShift(null); return; }
      if (showCreate) { setShowCreate(false); return; }
      if (editingShift) { setEditingShift(null); return; }
      if (deleteTarget) { setDeleteTarget(null); return; }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showCreate, editingShift, deleteTarget, selectedShift]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Shift Management</h1>
            <p className="mt-1 text-sm text-gray-400">Create, schedule, and manage workforce shifts across your team.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#162d5e] sm:w-auto sm:px-6"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Create Shift
          </button>
        </div>

        {/* ── Stat summary (clickable) ─────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <FilterStatCard
            label="Total Shifts"
            value={statusCounts.all}
            icon={CalendarDays}
            active={statusFilter === "all"}
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          />
          <FilterStatCard
            label="Ongoing"
            value={statusCounts.ongoing}
            icon={CheckCircle2}
            active={statusFilter === "ongoing"}
            onClick={() => {
              setStatusFilter("ongoing");
              setCurrentPage(1);
            }}
          />
          <FilterStatCard
            label="Upcoming"
            value={statusCounts.upcoming}
            icon={Timer}
            active={statusFilter === "upcoming"}
            onClick={() => {
              setStatusFilter("upcoming");
              setCurrentPage(1);
            }}
          />
          <FilterStatCard
            label="Completed"
            value={statusCounts.completed}
            icon={CalendarX}
            active={statusFilter === "completed"}
            onClick={() => {
              setStatusFilter("completed");
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          {/* ── Table Card ─────────────────────────────────── */}
          <div className="order-2 overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-sm lg:order-1 lg:col-span-8">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {/* Filter Tabs */}
              <div className="inline-flex w-full flex-wrap gap-1 rounded-full bg-slate-100/80 p-1 sm:w-auto">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`min-h-[40px] flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-all sm:flex-none sm:px-4 ${
                      statusFilter === tab.key
                        ? "bg-white text-[#1B3F8B] shadow-sm ring-1 ring-gray-200/80"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}{" "}
                    <span className="tabular-nums text-slate-400">({tab.count})</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72 sm:shrink-0">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search shifts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
                  aria-label="Search shifts"
                />
                {search.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 sm:px-6">
                <SkeletonTable rows={3} cols={5} />
              </div>
            ) : filteredShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <CalendarDays className="h-12 w-12 mb-3 opacity-25" />
              <p className="text-base font-medium text-slate-600">No shifts found</p>
              <p className="text-sm text-slate-400 mt-1">Try a different filter or create a new shift.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 px-4 pb-4 md:hidden">
                {filteredShifts.map((shift) => {
                  const slots = Number(shift.slotsAvailable) || 0;
                  const accepted = shift.acceptedEmployees?.length || 0;
                  const fillPct = Math.min(Math.round((accepted / Math.max(slots, 1)) * 100), 100);
                  const st = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                  const cfg = STATUS_CONFIG[st];
                  const dtOpts = {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  };
                  return (
                    <div
                      key={shift._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedShift(shift)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedShift(shift);
                        }
                      }}
                      className={`cursor-pointer rounded-xl border border-gray-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${mobileStatusBorder(shift)}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-sm font-semibold leading-tight text-gray-900">{shift.shiftTitle}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {accepted}/{slots} filled
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                        >
                          {st === "ongoing" ? (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
                            </span>
                          ) : (
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          )}
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${fillPct >= 100 ? "bg-emerald-500" : fillPct >= 60 ? "bg-blue-500" : "bg-amber-400"}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <div className="mb-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-10 flex-shrink-0 text-gray-400">Start</span>
                          <span className="font-medium">
                            {new Date(shift.shiftStartTime).toLocaleString("en-DE", dtOpts)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-10 flex-shrink-0 text-gray-400">End</span>
                          <span className="font-medium">
                            {new Date(shift.shiftEndTime).toLocaleString("en-DE", dtOpts)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          title="View details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShift(shift);
                          }}
                          className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1B3F8B]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit shift"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShift(shift);
                          }}
                          className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#1B3F8B]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete shift"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(shift);
                          }}
                          className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fill Rate</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShifts.map(shift => (
                      <ShiftRow
                        key={shift._id}
                        shift={shift}
                        onView={setSelectedShift}
                        onEdit={setEditingShift}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Footer count */}
          {!loading && filteredShifts.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 space-y-3">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{filteredShifts.length}</span> of{" "}
                <span className="font-semibold text-slate-600">{shiftListTotal}</span> shifts · Page{" "}
                <span className="font-semibold text-slate-600">{currentPage}</span> of{" "}
                <span className="font-semibold text-slate-600">{totalPages}</span>
              </p>
              <div className="flex items-center justify-between mt-4 px-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition"
                >
                  Next →
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center pt-2 md:hidden">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
          </div>

          <aside className="order-1 lg:order-2 lg:col-span-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-sm font-semibold text-slate-900">Shift status</h2>
              <p className="mt-0.5 text-xs text-gray-400">Distribution across all shifts</p>
              <div className="mt-4 flex flex-col items-center">
                <DonutChart data={shiftDonutData} size={120} centerValue={String(donutTotal)} centerLabel="Total" />
                <DonutLegendMini rows={donutLegendRows} total={donutTotal} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────── */}
      <CreateShiftModal
        show={showCreate}
        setShow={setShowCreate}
        createShift={createShift}
        onChange={onChange}
        onSubmit={onSubmit}
      />

      {editingShift && (
        <EditShiftModal
          editingShift={editingShift}
          setEditingShift={setEditingShift}
          onEditChange={onEditChange}
          onUpdateHandler={onUpdateHandler}
        />
      )}

      {/* Shift Detail Drawer */}
      {selectedShift && (
        <ShiftDetailDrawer
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          onEdit={(s) => { setSelectedShift(null); setEditingShift(s); }}
          onDelete={(s) => { setSelectedShift(null); setDeleteTarget(s); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-8 border-red-100 flex items-center justify-center mb-5">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Shift?</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-800">"{deleteTarget.shiftTitle}"</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition text-sm disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerShifts;
