import React, { useEffect, useState, useCallback, useMemo } from "react";
import API from "@/api";
import { toast } from "sonner";
import {
    ClipboardList, ArrowRightLeft, LogOut as LeaveIcon,
    Calendar, Search, ChevronDown, X,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const toInput = (d) => new Date(d).toISOString().split("T")[0];
const startDay = (s) => { const d = new Date(s); d.setHours(0, 0, 0, 0); return d; };
const endDay = (s) => { const d = new Date(s); d.setHours(23, 59, 59, 999); return d; };
const defFrom = () => { const d = new Date(); d.setDate(d.getDate() - 30); return toInput(d); };
const defTo = () => toInput(new Date());

const TYPE_CFG = {
    leave: { label: "Leave", Icon: LeaveIcon, badge: "bg-red-100 text-red-700 border-red-200" },
    shift_change: { label: "Shift Change", Icon: ArrowRightLeft, badge: "bg-amber-100 text-amber-700 border-amber-200" },
};
const STATUS_CFG = {
    pending: { label: "Pending", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse", row: "bg-yellow-50/50" },
    approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", row: "bg-emerald-50/30" },
    rejected: { label: "Rejected", badge: "bg-red-100 text-red-700", dot: "bg-red-500", row: "bg-red-50/20" },
};

/* ══════════════════════════════════════════════════════════
   MY REQUESTS PAGE
══════════════════════════════════════════════════════════ */
const MyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState(defFrom());
    const [dateTo, setDateTo] = useState(defTo());

    /* ── Fetch ── */
    const fetchRequests = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await API.get("/api/employee/shifts/requests");
            setRequests(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch { toast.error("Failed to load requests"); }
        finally { setLoading(false); }
    }, []);

    /* ── Auto-refresh every 30 s ── */
    useEffect(() => {
        fetchRequests();
        const id = setInterval(() => fetchRequests(true), 30_000);
        return () => clearInterval(id);
    }, [fetchRequests]);

    /* ── Re-fetch on tab focus / visibility ── */
    useEffect(() => {
        const fn = () => fetchRequests(true);
        window.addEventListener("focus", fn);
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") fn(); });
        return () => window.removeEventListener("focus", fn);
    }, [fetchRequests]);

    /* ── Computed ── */
    const inRange = useCallback((r) => {
        const d = new Date(r.createdAt);
        return d >= startDay(dateFrom) && d <= endDay(dateTo);
    }, [dateFrom, dateTo]);

    const ranged = useMemo(() => requests.filter(inRange), [requests, inRange]);

    const counts = {
        all: ranged.length,
        pending: ranged.filter(r => r.status === "pending").length,
        approved: ranged.filter(r => r.status === "approved").length,
        rejected: ranged.filter(r => r.status === "rejected").length,
    };

    const visible = useMemo(() => ranged
        .filter(r => statusFilter === "all" || r.status === statusFilter)
        .filter(r => typeFilter === "all" || r.type === typeFilter)
        .filter(r => {
            if (!search) return true;
            const q = search.toLowerCase();
            return r.currentShift?.shiftTitle?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q);
        }),
        [ranged, statusFilter, typeFilter, search]);

    return (
        <div className="p-6 md:p-8 space-y-5">

            {/* ── Page header ── */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
                <p className="text-sm text-slate-500 mt-0.5">Track your leave and shift change requests</p>
            </div>

            {/* ── ONE combined filter bar ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">

                {/* Date range */}
                <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50" />
                    <ChevronDown size={12} className="text-slate-300 -rotate-90" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50" />
                </div>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Summary counts inline */}
                <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="text-slate-500"><span className="font-bold text-slate-800">{counts.all}</span> total</span>
                    <span className="text-yellow-600"><span className="font-bold">{counts.pending}</span> pending</span>
                    <span className="text-emerald-600"><span className="font-bold">{counts.approved}</span> approved</span>
                    <span className="text-red-500"><span className="font-bold">{counts.rejected}</span> rejected</span>
                </div>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Type chips */}
                {[["all", "All"], ["leave", "Leave"], ["shift_change", "Shift Change"]].map(([k, l]) => (
                    <button key={k} onClick={() => setTypeFilter(k)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                        ${typeFilter === k ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >{l}</button>
                ))}

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Status chips */}
                {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([k, l]) => (
                    <button key={k} onClick={() => setStatusFilter(k)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                        ${statusFilter === k ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                        {l}
                        <span className={`text-[10px] font-bold ${statusFilter === k ? "text-white/70" : "text-slate-400"}`}>{counts[k]}</span>
                    </button>
                ))}

                {/* Search — right */}
                <div className="relative ml-auto">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="pl-7 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 w-36" />
                    {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={11} /></button>}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <ClipboardList size={38} className="text-slate-200 mb-3" />
                        <p className="text-slate-500 font-medium text-sm">No requests in this range</p>
                        <p className="text-slate-400 text-xs mt-1">Try a different date range or filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Reason / Note</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {visible.map(req => {
                                    const typeCfg = TYPE_CFG[req.type] || TYPE_CFG.leave;
                                    const statusCfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
                                    const TypeIcon = typeCfg.Icon;
                                    return (
                                        <tr key={req._id} className={`transition-all hover:brightness-[0.97] ${statusCfg.row}`}>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeCfg.badge}`}>
                                                    <TypeIcon size={10} />{typeCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{req.currentShift?.shiftTitle || "—"}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{fmtDate(req.currentShift?.shiftStartTime)}</p>
                                                {req.requestedShift && <p className="text-xs text-amber-600 mt-0.5">→ {req.requestedShift.shiftTitle}</p>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-xs text-slate-500 italic max-w-[180px] truncate">{req.reason || <span className="not-italic text-slate-300">—</span>}</p>
                                                {req.managerNote && (
                                                    <p className="text-xs text-indigo-600 mt-0.5 truncate max-w-[180px]">💬 {req.managerNote}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <p className="text-xs font-medium text-slate-700">{fmtDate(req.createdAt)}</p>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <p className="text-xs font-medium text-slate-700">{req.resolvedAt ? fmtDate(req.resolvedAt) : <span className="text-slate-300">—</span>}</p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
                            <p className="text-xs text-slate-400">
                                Showing <span className="font-semibold text-slate-600">{visible.length}</span> of{" "}
                                <span className="font-semibold text-slate-600">{counts.all}</span> requests · auto-refreshes every 30s
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyRequests;
