import React, { useEffect, useState, useCallback } from "react";
import API from "@/api";
import { toast } from "sonner";
import {
    ClipboardList, ArrowRightLeft, LogOut as LeaveIcon,
    RefreshCw, CheckCircle2, XCircle, Clock,
} from "lucide-react";

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const TYPE_CFG = {
    leave: { label: "Leave Request", Icon: LeaveIcon, color: "text-red-600", bg: "bg-red-50   border-red-200" },
    shift_change: { label: "Shift Change Request", Icon: ArrowRightLeft, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
};

const STATUS_CFG = {
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse" },
    approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const MyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    /* ── Fetch (memoised so it can be called from multiple places) ── */
    const fetchRequests = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await API.get("/api/employee/shifts/requests");
            setRequests(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch {
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    }, []);

    /* ── Fetch on mount ── */
    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    /* ── Re-fetch silently whenever the tab becomes visible again ── */
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") fetchRequests(true);
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [fetchRequests]);

    /* ── Also re-fetch when the window regains focus ── */
    useEffect(() => {
        const onFocus = () => fetchRequests(true);
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [fetchRequests]);

    const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

    const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === "pending").length,
        approved: requests.filter(r => r.status === "approved").length,
        rejected: requests.filter(r => r.status === "rejected").length,
    };

    return (
        <div className="p-6 md:p-8 space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Track your leave and shift change requests</p>
                </div>
                <button
                    onClick={() => fetchRequests()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* ── Summary stat chips ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { key: "all", label: "Total", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                    { key: "pending", label: "Pending", bg: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                    { key: "approved", label: "Approved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    { key: "rejected", label: "Rejected", bg: "bg-red-50 text-red-700 border-red-200" },
                ].map(s => (
                    <button
                        key={s.key}
                        onClick={() => setFilter(s.key)}
                        className={`rounded-2xl border p-3 text-center transition-all ${s.bg} ${filter === s.key ? "ring-2 ring-offset-1 ring-current" : "opacity-80 hover:opacity-100"}`}
                    >
                        <p className="text-2xl font-bold tabular-nums">{counts[s.key]}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                    </button>
                ))}
            </div>

            {/* ── Filter tabs ── */}
            <div className="flex gap-2 flex-wrap">
                {["all", "pending", "approved", "rejected"].map(key => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all
                        ${filter === key
                                ? "bg-emerald-600 text-white shadow-md"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
                            }`}
                    >
                        {key}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                        ${filter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── List ── */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16">
                    <ClipboardList size={40} className="text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No {filter !== "all" ? filter : ""} requests found</p>
                    <p className="text-slate-400 text-sm mt-1">Go to My Shifts to submit a leave or shift change request</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(req => {
                        const typeCfg = TYPE_CFG[req.type] || TYPE_CFG.leave;
                        const statusCfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
                        const TypeIcon = typeCfg.Icon;

                        return (
                            <div key={req._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">

                                        {/* Type icon */}
                                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${typeCfg.bg}`}>
                                            <TypeIcon size={18} className={typeCfg.color} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Title + status */}
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <p className="text-sm font-bold text-slate-800">{typeCfg.label}</p>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            {/* Shift info */}
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                <p>
                                                    <span className="font-semibold text-slate-600">From:</span>{" "}
                                                    {req.currentShift?.shiftTitle}
                                                    {req.currentShift && <> &mdash; {fmtDate(req.currentShift.shiftStartTime)}</>}
                                                </p>
                                                {req.requestedShift && (
                                                    <p>
                                                        <span className="font-semibold text-slate-600">To:</span>{" "}
                                                        {req.requestedShift?.shiftTitle} &mdash; {fmtDate(req.requestedShift.shiftStartTime)}
                                                    </p>
                                                )}
                                                {req.reason && (
                                                    <p className="mt-1">
                                                        <span className="font-semibold text-slate-600">Reason:</span>{" "}
                                                        <span className="italic">{req.reason}</span>
                                                    </p>
                                                )}
                                                {req.managerNote && (
                                                    <p className="mt-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                                                        <span className="font-semibold">Manager note:</span> {req.managerNote}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-400">Submitted</p>
                                        <p className="text-xs font-semibold text-slate-600 mt-0.5">{fmtDate(req.createdAt)}</p>
                                        {req.resolvedAt && (
                                            <>
                                                <p className="text-xs text-slate-400 mt-1">Resolved</p>
                                                <p className="text-xs font-semibold text-slate-600">{fmtDate(req.resolvedAt)}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyRequests;
