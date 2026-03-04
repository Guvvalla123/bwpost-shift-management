import React, { useEffect, useState } from "react";
import API from "@/api";
import { toast } from "sonner";
import {
    Calendar, Clock, CheckCircle2, XCircle, Loader2,
    AlertTriangle, ChevronRight, ArrowRightLeft, LogOut as LeaveIcon,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const getStatus = (start, end) => {
    const now = Date.now();
    if (new Date(start) > now) return "upcoming";
    if (new Date(end) < now) return "completed";
    return "ongoing";
};

const STATUS_CFG = {
    upcoming: { label: "Upcoming", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    ongoing: { label: "Ongoing", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" },
    completed: { label: "Completed", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

/* ─── Leave / Change Request Modal ───────────────────────── */
const RequestModal = ({ shift, allShifts, type, onClose, onSuccess }) => {
    const [reason, setReason] = useState("");
    const [requestedShiftId, setRequestedShiftId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (type === "leave") {
                await API.post("/api/employee/shifts/requests/leave", {
                    shiftId: shift._id,
                    reason,
                });
                toast.success("Leave request submitted!");
            } else {
                if (!requestedShiftId) { toast.error("Please select a shift to switch to"); return; }
                await API.post("/api/employee/shifts/requests/shift-change", {
                    currentShiftId: shift._id,
                    requestedShiftId,
                    reason,
                });
                toast.success("Shift change request submitted!");
            }
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    // Available shifts to switch to (upcoming, not the current one)
    const switchable = allShifts.filter(s => s._id !== shift._id && new Date(s.shiftStartTime) > Date.now());

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={`px-6 py-5 rounded-t-2xl ${type === "leave" ? "bg-gradient-to-r from-red-600 to-rose-600" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}>
                    <div className="flex items-center gap-3">
                        {type === "leave" ? <LeaveIcon size={20} className="text-white" /> : <ArrowRightLeft size={20} className="text-white" />}
                        <div>
                            <h3 className="text-white font-bold text-lg">
                                {type === "leave" ? "Request Leave" : "Request Shift Change"}
                            </h3>
                            <p className="text-white/80 text-sm">{shift.shiftTitle}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Current shift info */}
                    <div className="bg-slate-50 rounded-xl p-4 text-sm">
                        <p className="font-semibold text-slate-700 mb-1">Current Shift</p>
                        <p className="text-slate-500">{fmtDate(shift.shiftStartTime)} · {fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}</p>
                    </div>

                    {/* Shift to switch to (only for shift_change) */}
                    {type === "shift_change" && (
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Switch to Shift</label>
                            <select
                                value={requestedShiftId}
                                onChange={e => setRequestedShiftId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 bg-slate-50"
                            >
                                <option value="">— Select a shift —</option>
                                {switchable.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.shiftTitle} · {fmtDate(s.shiftStartTime)} ({s.slotsAvailable} slots)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Reason (optional)</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            placeholder="Briefly explain why..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-slate-50"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all
              ${type === "leave"
                                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-md"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-md"
                                } disabled:opacity-60`}
                        >
                            {submitting && <Loader2 size={14} className="animate-spin" />}
                            Submit Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════
   MY SHIFTS PAGE
══════════════════════════════════════════════════════════════ */
const MyShifts = () => {
    const [shifts, setShifts] = useState([]);
    const [allShifts, setAllShifts] = useState([]); // for shift-change dropdown
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [modal, setModal] = useState(null); // { shift, type }

    const fetchShifts = async () => {
        try {
            const [myRes, allRes] = await Promise.all([
                API.get("/api/employee/shifts/myshifts"),
                API.get("/api/employee/shifts/Availableshifts"),
            ]);
            setShifts(Array.isArray(myRes.data?.data) ? myRes.data.data : []);
            setAllShifts(Array.isArray(allRes.data?.data) ? allRes.data.data : []);
        } catch {
            toast.error("Failed to load shifts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShifts(); }, []);

    const filtered = filter === "all"
        ? shifts
        : shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === filter);

    const counts = {
        all: shifts.length,
        upcoming: shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "upcoming").length,
        ongoing: shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "ongoing").length,
        completed: shifts.filter(s => getStatus(s.shiftStartTime, s.shiftEndTime) === "completed").length,
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Shifts</h1>
                <p className="text-sm text-slate-500 mt-0.5">All shifts you are assigned to</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: "all", label: "All" },
                    { key: "upcoming", label: "Upcoming" },
                    { key: "ongoing", label: "Ongoing" },
                    { key: "completed", label: "Completed" },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${filter === tab.key
                                ? "bg-emerald-600 text-white shadow-md"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
                            }`}
                    >
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
            ${filter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {counts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Shifts list */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16">
                    <Calendar size={40} className="text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No {filter !== "all" ? filter : ""} shifts found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(shift => {
                        const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                        const cfg = STATUS_CFG[status];

                        return (
                            <div key={shift._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        {/* Date box */}
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center shrink-0">
                                            <p className="text-emerald-600 text-xs font-semibold uppercase">{new Date(shift.shiftStartTime).toLocaleDateString(undefined, { month: "short" })}</p>
                                            <p className="text-emerald-800 text-xl font-bold leading-none">{new Date(shift.shiftStartTime).getDate()}</p>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-slate-800 truncate">{shift.shiftTitle}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${cfg.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1"><Calendar size={13} />{fmtDate(shift.shiftStartTime)}</span>
                                                <span className="flex items-center gap-1"><Clock size={13} />{fmtTime(shift.shiftStartTime)} — {fmtTime(shift.shiftEndTime)}</span>
                                            </div>
                                            {shift.shiftNotes && (
                                                <p className="text-xs text-slate-400 mt-1.5 truncate">{shift.shiftNotes}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions (only for upcoming shifts) */}
                                    {status === "upcoming" && (
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => setModal({ shift, type: "shift_change" })}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                            >
                                                <ArrowRightLeft size={13} />
                                                Change
                                            </button>
                                            <button
                                                onClick={() => setModal({ shift, type: "leave" })}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                                            >
                                                <LeaveIcon size={13} />
                                                Leave
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <RequestModal
                    shift={modal.shift}
                    allShifts={allShifts}
                    type={modal.type}
                    onClose={() => setModal(null)}
                    onSuccess={fetchShifts}
                />
            )}
        </div>
    );
};

export default MyShifts;
