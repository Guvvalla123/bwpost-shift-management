import React, { useEffect, useState, useCallback } from "react";
import API from "@/api";
import { toast } from "sonner";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, ChevronDown,
  ArrowRightLeft, LogOut as LeaveIcon, Search, RefreshCw,
  Calendar, User, MessageSquare, Loader2,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const initials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
const GRADS = ["from-blue-500 to-indigo-600", "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600", "from-orange-500 to-amber-500", "from-rose-500 to-pink-600"];
const grad = (n = "") => GRADS[(n.charCodeAt(0) || 0) % GRADS.length];

const TYPE_CFG = {
  leave: { label: "Leave Request", Icon: LeaveIcon, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", badge: "bg-red-100 text-red-700" },
  shift_change: { label: "Shift Change", Icon: ArrowRightLeft, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", badge: "bg-amber-100 text-amber-700" },
};

const STATUS_CFG = {
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

/* ─── Resolve Modal ───────────────────────────────────────── */
const ResolveModal = ({ request, action, onClose, onSuccess }) => {
  const [note, setNote] = useState("");
  const [submitting, setSubmit] = useState(false);

  const handleSubmit = async () => {
    setSubmit(true);
    try {
      await API.put(`/api/manager/requests/${request._id}/${action}`, { managerNote: note });
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setSubmit(false);
    }
  };

  const isApprove = action === "approve";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`px-6 py-5 rounded-t-2xl ${isApprove ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-red-600 to-rose-600"}`}>
          <div className="flex items-center gap-3">
            {isApprove ? <CheckCircle2 size={22} className="text-white" /> : <XCircle size={22} className="text-white" />}
            <div>
              <h3 className="text-white font-bold text-lg">{isApprove ? "Approve Request" : "Reject Request"}</h3>
              <p className="text-white/80 text-sm">
                {request.employee?.username} — {TYPE_CFG[request.type]?.label}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Request summary */}
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
            <p className="font-semibold text-slate-700">Request Details</p>
            <p className="text-slate-500">
              <span className="font-medium text-slate-600">From:</span> {request.currentShift?.shiftTitle} ({fmtDate(request.currentShift?.shiftStartTime)})
            </p>
            {request.requestedShift && (
              <p className="text-slate-500">
                <span className="font-medium text-slate-600">To:</span> {request.requestedShift?.shiftTitle} ({fmtDate(request.requestedShift?.shiftStartTime)})
              </p>
            )}
            {request.reason && (
              <p className="text-slate-500">
                <span className="font-medium text-slate-600">Reason:</span> {request.reason}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Message to Employee (optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder={isApprove ? "e.g. Approved. Enjoy your day off." : "e.g. We need the full team this week."}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-slate-50"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
              ${isApprove ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-red-600 to-rose-600"}
              hover:shadow-md disabled:opacity-60 transition-all`}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isApprove ? "Approve" : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MANAGER SHIFT REQUESTS PAGE
══════════════════════════════════════════════════════════════ */
const ShiftRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { request, action }

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.status = filter;
      if (typeFilter !== "all") params.type = typeFilter;

      const res = await API.get("/api/manager/requests", { params });
      setRequests(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const displayed = requests.filter(r => {
    if (!search) return true;
    return r.employee?.username?.toLowerCase().includes(search.toLowerCase()) ||
      r.currentShift?.shiftTitle?.toLowerCase().includes(search.toLowerCase());
  });

  const counts = {
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage employee leave and shift change requests</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", count: counts.pending, cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
          { label: "Approved", count: counts.approved, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { label: "Rejected", count: counts.rejected, cls: "bg-red-50 text-red-700 border-red-200" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.cls}`}>
            <p className="text-3xl font-bold">{s.count}</p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status tabs */}
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(key => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all
              ${filter === key ? "bg-indigo-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {["all", "leave", "shift_change"].map(key => (
            <button key={key} onClick={() => setTypeFilter(key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all
              ${typeFilter === key ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {key === "shift_change" ? "Shift Change" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee or shift..."
            className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white w-56"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16">
          <ClipboardList size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(req => {
            const typeCfg = TYPE_CFG[req.type] || TYPE_CFG.leave;
            const statusCfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
            const TypeIcon = typeCfg.Icon;

            return (
              <div key={req._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">

                  {/* Employee avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad(req.employee?.username)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm overflow-hidden`}>
                    {req.employee?.profileImage
                      ? <img src={req.employee.profileImage} alt="" className="w-full h-full object-cover" />
                      : initials(req.employee?.username)
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="text-sm font-bold text-slate-800">{req.employee?.username || "—"}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${typeCfg.bg} ${typeCfg.border} ${typeCfg.color}`}>
                        <TypeIcon size={11} />
                        {typeCfg.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Shift info */}
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span><span className="font-semibold text-slate-600">From:</span> {req.currentShift?.shiftTitle} · {fmtDate(req.currentShift?.shiftStartTime)}</span>
                      </div>
                      {req.requestedShift && (
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft size={11} className="text-slate-400 shrink-0" />
                          <span><span className="font-semibold text-slate-600">To:</span> {req.requestedShift?.shiftTitle} · {fmtDate(req.requestedShift?.shiftStartTime)}</span>
                        </div>
                      )}
                      {req.reason && (
                        <div className="flex items-start gap-2">
                          <MessageSquare size={11} className="text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-slate-500 italic">"{req.reason}"</span>
                        </div>
                      )}
                      {req.managerNote && (
                        <div className="flex items-start gap-2 pt-1">
                          <MessageSquare size={11} className="text-indigo-400 shrink-0 mt-0.5" />
                          <span className="text-indigo-600 font-medium">Your note: "{req.managerNote}"</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2">
                      Submitted {fmtDate(req.createdAt)}
                      {req.resolvedAt && ` · Resolved ${fmtDate(req.resolvedAt)}`}
                    </p>
                  </div>

                  {/* Action buttons (only for pending) */}
                  {req.status === "pending" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => setModal({ request: req, action: "approve" })}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={13} />
                        Approve
                      </button>
                      <button
                        onClick={() => setModal({ request: req, action: "reject" })}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={13} />
                        Reject
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
