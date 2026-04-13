import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Pagination, SkeletonTable, EmptyState, ErrorState } from "@/components/ui";
import {
  ClipboardList, CheckCircle2, XCircle, Calendar,
  ArrowRightLeft, LogOut as LeaveIcon, Search,
  ChevronDown, X, Loader2, MessageSquare,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const toInput = (d) => new Date(d).toISOString().split("T")[0];
const startDay = (s) => { const d = new Date(s); d.setHours(0, 0, 0, 0); return d; };
const endDay = (s) => { const d = new Date(s); d.setHours(23, 59, 59, 999); return d; };
const defFrom = () => { const d = new Date(); d.setDate(d.getDate() - 30); return toInput(d); };
const defTo = () => toInput(new Date());

const GRADS = ["from-blue-500 to-[#162d5e]", "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500", "from-rose-500 to-pink-600"];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];
const inits = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const TYPE_CFG = {
  leave: { label: "Leave", Icon: LeaveIcon, badge: "bg-red-100 text-red-700 border-red-200" },
  shift_change: { label: "Shift Change", Icon: ArrowRightLeft, badge: "bg-amber-100 text-amber-700 border-amber-200" },
};
const STATUS_CFG = {
  pending: { label: "Pending", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse", row: "bg-yellow-50/50" },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", row: "bg-emerald-50/30" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700", dot: "bg-red-500", row: "bg-red-50/20" },
};

/* ─── Resolve Modal ───────────────────────────────────────── */
const ResolveModal = ({ request, action, onClose, onSuccess }) => {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await API.put(`/api/manager/requests/${request._id}/${action}`, { managerNote: note });
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally { setBusy(false); }
  };

  const isApprove = action === "approve";
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className={`px-6 py-5 rounded-t-2xl ${isApprove ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-red-600 to-rose-600"}`}>
          <div className="flex items-center gap-3">
            {isApprove ? <CheckCircle2 size={20} className="text-white" /> : <XCircle size={20} className="text-white" />}
            <div>
              <h3 className="text-white font-bold text-base">{isApprove ? "Approve" : "Reject"} Request</h3>
              <p className="text-white/75 text-xs mt-0.5">{request.employee?.username} — {TYPE_CFG[request.type]?.label}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Request Summary</p>
            <p className="text-slate-600"><span className="font-semibold">From:</span> {request.currentShift?.shiftTitle} ({fmtDate(request.currentShift?.shiftStartTime)})</p>
            {request.requestedShift && <p className="text-slate-600"><span className="font-semibold">To:</span> {request.requestedShift?.shiftTitle} ({fmtDate(request.requestedShift?.shiftStartTime)})</p>}
            {request.reason && <p className="text-slate-500 italic">"{request.reason}"</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Note to Employee (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder={isApprove ? "e.g. Approved. Enjoy your time off." : "e.g. We need full coverage that day."}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B] bg-slate-50"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button onClick={submit} disabled={busy}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60
                            ${isApprove ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-red-600 to-rose-600"}`}
            >
              {busy && <Loader2 size={13} className="animate-spin" />}
              {isApprove ? "Approve" : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MANAGER SHIFT REQUESTS PAGE
══════════════════════════════════════════════════════════ */
const ShiftRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dateFrom, setDateFrom] = useState(defFrom());
  const [dateTo, setDateTo] = useState(defTo());
  const [modal, setModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchError, setFetchError] = useState(false);

  /* ── Fetch ── */
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await API.get(`/api/manager/requests?${params}`);
      const { data, pagination } = res.data;
      setRequests(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(pagination?.total ?? 0);
    } catch {
      setFetchError(true);
      setRequests([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally { setLoading(false); }
  }, [currentPage, statusFilter, typeFilter]);

  /* ── Auto-refresh every 30 s ── */
  useEffect(() => {
    fetchRequests();
    const id = setInterval(() => fetchRequests(true), 30_000);
    return () => clearInterval(id);
  }, [fetchRequests]);

  /* ── Re-fetch on tab focus ── */
  useEffect(() => {
    const fn = () => fetchRequests(true);
    const visHandler = () => { if (document.visibilityState === "visible") fn(); };
    window.addEventListener("focus", fn);
    document.addEventListener("visibilitychange", visHandler);
    return () => {
      window.removeEventListener("focus", fn);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, [fetchRequests]);

  /* ── Computed ── */
  const inRange = useCallback((r) => {
    const d = new Date(r.createdAt);
    return d >= startDay(dateFrom) && d <= endDay(dateTo);
  }, [dateFrom, dateTo]);

  const ranged = useMemo(() => requests.filter(inRange), [requests, inRange]);

  const visible = useMemo(() => ranged.filter(r => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return r.employee?.username?.toLowerCase().includes(q)
        || r.currentShift?.shiftTitle?.toLowerCase().includes(q)
        || r.reason?.toLowerCase().includes(q);
    }),
    [ranged, debouncedSearch]);

  return (
    <div className="p-6 md:p-8 space-y-5">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shift Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">Review and act on employee leave and shift-change requests</p>
      </div>

      {/* ── ONE combined filter bar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] bg-slate-50" />
          <ChevronDown size={12} className="text-slate-300 -rotate-90" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] bg-slate-50" />
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Summary counts inline */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="text-slate-500"><span className="font-bold text-slate-800">{totalItems}</span> total</span>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Type chips */}
        {[["all", "All"], ["leave", "Leave"], ["shift_change", "Shift Change"]].map(([k, l]) => (
          <button key={k} onClick={() => { setTypeFilter(k); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                        ${typeFilter === k ? "bg-[#1B3F8B] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >{l}</button>
        ))}

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Status chips */}
        {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([k, l]) => (
          <button key={k} onClick={() => { setStatusFilter(k); setCurrentPage(1); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                        ${statusFilter === k ? "bg-[#1B3F8B] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {l}
            <span className={`text-[10px] font-bold ${statusFilter === k ? "text-white/70" : "text-slate-400"}`}>
              {statusFilter === k ? totalItems : ""}
            </span>
          </button>
        ))}

        {/* Search — pushed to right */}
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search…"
            className="pl-7 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] bg-slate-50 w-44" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={11} /></button>}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={6} cols={5} />
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <ErrorState
              title="Failed to load requests"
              message="Could not fetch shift requests."
              onRetry={fetchRequests}
            />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests found"
            message="No shift requests match your current filter."
          />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList size={38} className="text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium text-sm">No matching requests</p>
            <p className="text-slate-400 text-xs mt-1">Try a different search or date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
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
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad(req.employee?.username)} flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden`}>
                            {req.employee?.profileImage
                              ? <img src={req.employee.profileImage} alt="" className="w-full h-full object-cover" />
                              : inits(req.employee?.username || "")}
                          </div>
                          <span className="text-sm font-semibold text-slate-800 truncate max-w-[110px]">{req.employee?.username || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeCfg.badge}`}>
                          <TypeIcon size={10} />{typeCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-800 truncate max-w-[150px]">{req.currentShift?.shiftTitle || "—"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(req.currentShift?.shiftStartTime)}</p>
                        {req.requestedShift && <p className="text-xs text-amber-600 mt-0.5">→ {req.requestedShift.shiftTitle}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-500 italic max-w-[160px] truncate">{req.reason || <span className="not-italic text-slate-300">—</span>}</p>
                        {req.managerNote && (
                          <p className="text-xs text-[#1B3F8B] mt-0.5 flex items-center gap-1 max-w-[160px] truncate">
                            <MessageSquare size={10} />{req.managerNote}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-medium text-slate-700">{fmtDate(req.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setModal({ request: req, action: "approve" })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
                              <CheckCircle2 size={12} /> Approve
                            </button>
                            <button onClick={() => setModal({ request: req, action: "reject" })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">{req.resolvedAt ? fmtDate(req.resolvedAt) : "—"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{visible.length}</span> on this page ·{" "}
                <span className="font-semibold text-slate-600">{totalItems}</span> total · auto-refreshes every 30s
              </p>
            </div>
          </div>
        )}
        {!loading && !fetchError && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={20}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        )}
      </div>

      {modal && (
        <ResolveModal
          request={modal.request}
          action={modal.action}
          onClose={() => setModal(null)}
          onSuccess={fetchRequests}
        />
      )}
    </div>
  );
};

export default ShiftRequest;
