import API from "@/api";
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, CalendarDays, Clock, Users, Trash2,
  Pencil, Search, X, AlignLeft, AlertTriangle,
  CheckCircle2, Timer, CalendarX, ChevronRight,
  UserCheck, FileText, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import CreateShiftModal from "./CreateShiftModal";
import EditShiftModal from "./EditShiftModal";

/* ─── Helpers ────────────────────────────────────────────── */
const now = () => new Date();

const getStatus = (start, end) => {
  const s = new Date(start), e = new Date(end), n = now();
  if (n < s) return "upcoming";
  if (n >= s && n <= e) return "ongoing";
  return "completed";
};

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

/* ─── Stat Card ──────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, gradient }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${gradient}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{value}</p>
    </div>
  </div>
);

/* ─── Avatar helpers ─────────────────────────────────────── */
const GRADS = [
  "from-blue-600 to-indigo-600", "from-violet-600 to-purple-600",
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
      onClick={onClose}
    >
      <div
        className="bg-white h-full w-full sm:w-[440px] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 p-6">
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
                <Clock size={13} className="text-indigo-500" />
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
      className="group hover:bg-blue-50/30 transition-colors duration-150 cursor-pointer"
      onClick={() => onView(shift)}
    >
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
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
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(shift); }}
            className="p-2 rounded-lg text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
            title="Edit shift"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(shift); }}
            className="p-2 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
            title="Delete shift"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 ml-1 transition-colors" />
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
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const [createShift, setCreateShift] = useState({
    shiftTitle: "", shiftStartTime: "", shiftEndTime: "",
    shiftNotes: "", slotsAvailable: "",
  });

  /* ── Fetch ── */
  const fetchShifts = async () => {
    try {
      const res = await API.get("/api/manager/shifts");
      setShifts(res.data.data || []);
    } catch {
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchShifts(); }, []);

  /* ── Create ── */
  const onChange = (e) => setCreateShift({ ...createShift, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!createShift.shiftTitle || !createShift.shiftStartTime || !createShift.shiftEndTime || !createShift.slotsAvailable) {
      return toast.error("Please fill all required fields");
    }
    try {
      await API.post("/api/manager/shifts", createShift);
      toast.success("Shift created successfully");
      setCreateShift({ shiftTitle: "", shiftStartTime: "", shiftEndTime: "", shiftNotes: "", slotsAvailable: "" });
      setShowCreate(false);
      fetchShifts();
    } catch { toast.error("Failed to create shift"); }
  };

  /* ── Edit ── */
  const onEditChange = (e) => setEditingShift({ ...editingShift, [e.target.name]: e.target.value });
  const onUpdateHandler = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/api/manager/shifts/${editingShift._id}`, editingShift);
      toast.success("Shift updated");
      setEditingShift(null);
      fetchShifts();
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
      fetchShifts();
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(false); }
  };

  /* ── Stats ── */
  const totalShifts = shifts.length;
  const upcomingShifts = shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "upcoming").length;
  const ongoingShifts = shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "ongoing").length;
  const totalEmployees = shifts.reduce((acc, s) => acc + (s.acceptedEmployees?.length || 0), 0);

  /* ── Filter ── */
  const filteredShifts = useMemo(() =>
    shifts
      .filter(s => s.shiftTitle?.toLowerCase().includes(search.toLowerCase()))
      .filter(s => statusFilter === "all" || getStatus(s.shiftStartTime, s.shiftEndTime) === statusFilter),
    [shifts, search, statusFilter]
  );

  const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "ongoing", label: "Ongoing" },
    { key: "completed", label: "Completed" },
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shift Management</h1>
            <p className="text-slate-500 text-sm mt-1">Create, schedule and manage your workforce shifts.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Shift
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Shifts" value={totalShifts} icon={CalendarDays} gradient="bg-gradient-to-br from-blue-600 to-indigo-600" />
          <StatCard label="Upcoming" value={upcomingShifts} icon={Timer} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
          <StatCard label="Ongoing" value={ongoingShifts} icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
          <StatCard label="Assigned Employees" value={totalEmployees} icon={Users} gradient="bg-gradient-to-br from-orange-500 to-amber-500" />
        </div>

        {/* ── Table Card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${statusFilter === tab.key
                    ? "bg-white shadow-sm text-blue-700 border border-slate-100"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search shifts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-slate-400">Loading shifts…</p>
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <CalendarDays className="h-12 w-12 mb-3 opacity-25" />
              <p className="text-base font-medium text-slate-600">No shifts found</p>
              <p className="text-sm text-slate-400 mt-1">Try a different filter or create a new shift.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fill Rate</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
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
          )}

          {/* Footer count */}
          {!loading && filteredShifts.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{filteredShifts.length}</span> of{" "}
                <span className="font-semibold text-slate-600">{totalShifts}</span> shifts
              </p>
            </div>
          )}
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
