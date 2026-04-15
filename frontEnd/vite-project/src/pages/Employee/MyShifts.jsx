import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Pagination, SkeletonTable, EmptyState, ErrorState } from "@/components/ui";
import {
    Calendar, Clock, Loader2,
    ArrowRightLeft, LogOut as LeaveIcon,
    CalendarX,
} from "lucide-react";
import { getStatus } from "@/utils/shiftStatus";

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

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
            toast.error(getApiErrorMessage(err, "Failed to submit request"));
        } finally {
            setSubmitting(false);
        }
    };

    // Available shifts to switch to (upcoming, not the current one)
    const switchable = allShifts.filter(s => s._id !== shift._id && new Date(s.shiftStartTime) > Date.now());

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
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
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B] bg-slate-50"
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
const formatCardDateTime = (iso) =>
    new Date(iso).toLocaleString("en-DE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

const MyShifts = () => {
    const navigate = useNavigate();
    const [shifts, setShifts] = useState([]);
    const [allShifts, setAllShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filter, setFilter] = useState("all");
    const [modal, setModal] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(() => new Date());

    const fetchMyShifts = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setFetchError(false);
        }
        try {
            const myParams = new URLSearchParams();
            myParams.set("page", String(currentPage));
            myParams.set("limit", "20");
            const allParams = new URLSearchParams({ limit: "50", page: "1" });
            const [myRes, allRes] = await Promise.all([
                API.get(`/api/employee/shifts/myshifts?${myParams}`),
                API.get(`/api/employee/shifts/available-shifts?${allParams}`),
            ]);
            const { data, pagination } = myRes.data;
            setShifts(Array.isArray(data) ? data : []);
            setTotalPages(pagination?.totalPages ?? 1);
            setTotalItems(pagination?.total ?? 0);
            setAllShifts(Array.isArray(allRes.data?.data) ? allRes.data.data : []);
            setLastUpdated(new Date());
        } catch (err) {
            if (!silent) {
                setFetchError(true);
                setShifts([]);
                setAllShifts([]);
                setTotalPages(1);
                setTotalItems(0);
            }
            if (import.meta.env.DEV) console.error("Refresh error:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => { fetchMyShifts(false); }, [fetchMyShifts]);

    useEffect(() => {
        const interval = setInterval(() => fetchMyShifts(true), 30000);
        return () => clearInterval(interval);
    }, [fetchMyShifts]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") fetchMyShifts(true);
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [fetchMyShifts]);

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
        <div className="p-6">
            <SkeletonTable rows={5} cols={5} />
        </div>
    );

    if (fetchError) return (
        <div className="p-6">
            <ErrorState
                title="Failed to load your shifts"
                message="Could not load your shift history. Please try again."
                onRetry={() => fetchMyShifts(false)}
            />
        </div>
    );

    const managerLabel = (shift) => {
        const m = shift?.manager || shift?.managerId;
        if (!m) return null;
        if (typeof m === "object") return m.username || m.email || null;
        return null;
    };

    return (
        <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-0 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Shifts</h1>
                    <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">All shifts you are assigned to</p>
                </div>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                    { key: "all", label: "All" },
                    { key: "upcoming", label: "Upcoming" },
                    { key: "ongoing", label: "Ongoing" },
                    { key: "completed", label: "Completed" },
                ].map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => { setFilter(tab.key); setCurrentPage(1); }}
                        className={`flex-shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors
            ${filter === tab.key
                                ? "bg-[#1B3F8B] text-white"
                                : "bg-white text-gray-600 border border-gray-200"
                            }`}
                    >
                        {tab.label}
                        <span className={`text-xs font-semibold tabular-nums
            ${filter === tab.key ? "text-white/90" : "text-gray-500"}`}>
                            {counts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Shifts list */}
            {shifts.length === 0 ? (
                <EmptyState
                    icon={CalendarX}
                    title="No shifts assigned"
                    message="You have no upcoming or past shifts. Apply for available shifts."
                    action={{
                        label: "Browse Shifts",
                        onClick: () => navigate("/employee/AllShifts"),
                    }}
                />
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16">
                    <Calendar size={40} className="text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No {filter !== "all" ? filter : ""} shifts on this page</p>
                </div>
            ) : (
                <>
                    <div className="md:hidden space-y-3">
                        {filtered.map((shift) => {
                            const now = new Date();
                            const start = new Date(shift.shiftStartTime);
                            const end = new Date(shift.shiftEndTime);
                            const timelineStatus =
                                now < start ? "Upcoming" : now > end ? "Completed" : "Ongoing";
                            const badgeCls =
                                timelineStatus === "Upcoming"
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : timelineStatus === "Ongoing"
                                        ? "bg-green-50 text-green-700 border border-green-100"
                                        : "bg-gray-100 text-gray-600 border border-gray-200";
                            const apiStatus = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                            return (
                                <div
                                    key={shift._id}
                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                                >
                                    <div className="p-4 pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                                    {shift.shiftTitle}
                                                </h3>
                                            </div>
                                            <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badgeCls}`}>
                                                {timelineStatus}
                                            </span>
                                        </div>
                                        <div className="mt-3 space-y-1.5">
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <span className="text-gray-400 w-8 flex-shrink-0 font-medium">Start</span>
                                                <span className="font-medium text-gray-800">{formatCardDateTime(shift.shiftStartTime)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <span className="text-gray-400 w-8 flex-shrink-0 font-medium">End</span>
                                                <span className="font-medium text-gray-800">{formatCardDateTime(shift.shiftEndTime)}</span>
                                            </div>
                                        </div>
                                        {managerLabel(shift) && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                Manager: <span className="font-medium text-gray-800">{managerLabel(shift)}</span>
                                            </p>
                                        )}
                                        {shift.shiftNotes && (
                                            <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">{shift.shiftNotes}</p>
                                        )}
                                    </div>
                                    {apiStatus === "upcoming" && (
                                        <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setModal({ shift, type: "shift_change" })}
                                                className="w-full min-h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors inline-flex items-center justify-center gap-2"
                                            >
                                                <ArrowRightLeft size={16} />
                                                Change shift
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setModal({ shift, type: "leave" })}
                                                className="w-full min-h-11 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2"
                                            >
                                                <LeaveIcon size={16} />
                                                Request leave
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full min-w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Start</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">End</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Manager</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((shift) => {
                                    const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                                    const cfg = STATUS_CFG[status];
                                    return (
                                        <tr key={shift._id} className="hover:bg-slate-50/60">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-slate-900">{shift.shiftTitle}</p>
                                                {shift.shiftNotes && (
                                                    <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{shift.shiftNotes}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {fmtDate(shift.shiftStartTime)} {fmtTime(shift.shiftStartTime)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {fmtTime(shift.shiftEndTime)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {managerLabel(shift) || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                {status === "upcoming" ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setModal({ shift, type: "shift_change" })}
                                                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100"
                                                        >
                                                            <ArrowRightLeft size={13} />
                                                            Change
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setModal({ shift, type: "leave" })}
                                                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100"
                                                        >
                                                            <LeaveIcon size={13} />
                                                            Leave
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {!loading && !fetchError && shifts.length > 0 && (
                <>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={20}
                        onPageChange={setCurrentPage}
                        isLoading={loading}
                    />
                    <p className="text-xs text-gray-400 text-center py-3 md:hidden">
                        Updated{" "}
                        {lastUpdated.toLocaleTimeString("en-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </>
            )}

            {/* Modal */}
            {modal && (
                <RequestModal
                    shift={modal.shift}
                    allShifts={allShifts}
                    type={modal.type}
                    onClose={() => setModal(null)}
                    onSuccess={fetchMyShifts}
                />
            )}
        </div>
    );
};

export default MyShifts;
