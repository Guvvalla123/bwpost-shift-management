// MyRequestsPage.jsx
// Shows all shift requests submitted by the employee.
// Employee can see the status of each request (pending / approved / rejected).
// Filters (status, type, date range, search) are applied CLIENT-SIDE
// after the server returns a page of results.
//
// THIS FILE MANAGES STATE AND DATA.
// UI pieces are in separate component files:
// - MyRequestCard.jsx   shows one request as a card on mobile

import { useState, useEffect, useRef } from "react";
import { ClipboardList, Calendar, Search, X, FileText } from "lucide-react";
import {
  Pagination, SkeletonTable, SkeletonList,
  EmptyState, ErrorState,
} from "@/components/ui";

// Import API function
import { getMyRequests } from "./myRequestsApi";

// Import sub-component
import MyRequestCard from "./MyRequestCard";

// ── Helpers ────────────────────────────────────────────────────
function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}
function toInput(d) { return new Date(d).toISOString().split("T")[0]; }
function startOfDay(s) { const d = new Date(s); d.setHours(0,  0,  0,   0); return d; }
function endOfDay(s)   { const d = new Date(s); d.setHours(23, 59, 59, 999); return d; }
function defaultFrom() { const d = new Date(); d.setDate(d.getDate() - 30); return toInput(d); }

// TYPE_CFG and STATUS_CFG used in desktop table
const TYPE_CFG = {
  leave:        { label: "Leave",        badge: "bg-red-100 text-red-700 border-red-200" },
  shift_change: { label: "Shift Change", badge: "bg-amber-100 text-amber-700 border-amber-200" },
};
const STATUS_CFG = {
  pending:  { label: "Pending",  badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse", row: "bg-yellow-50/50" },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500",            row: "bg-emerald-50/30" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700",         dot: "bg-red-500",                row: "bg-red-50/20" },
};

// ── Main Component ─────────────────────────────────────────────
const MyRequestsPage = () => {
  // List of my requests from server
  const [requests, setRequests] = useState([]);

  // True while loading
  const [loading, setLoading] = useState(true);

  // True if last load failed
  const [fetchError, setFetchError] = useState(false);

  // Total count from pagination
  const [total, setTotal] = useState(0);

  // Total pages for pagination
  const [totalPages, setTotalPages] = useState(1);

  // Current page number
  const [currentPage, setCurrentPage] = useState(1);

  // ── Client-side filter state ────────────────────────────────
  // Status filter: "all" | "pending" | "approved" | "rejected"
  const [activeFilter, setActiveFilter] = useState("all");

  // Type filter: "all" | "leave" | "shift_change"
  const [typeFilter, setTypeFilter] = useState("all");

  // Date range filters (applied client-side)
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo,   setDateTo]   = useState(() => toInput(new Date()));

  // Search text (applied client-side after debounce)
  const [search, setSearch] = useState("");

  // Debounced version of search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ID of the request currently being cancelled
  const [cancellingId, setCancellingId] = useState(null);

  // Auto-refresh interval reference
  const refreshTimerRef = useRef(null);

  // ── Debounce search ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load data when page changes ────────────────────────────
  useEffect(() => {
    loadRequests();
  }, [currentPage]);

  // ── Auto-refresh every 60 seconds ─────────────────────────
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      loadRequestsSilent();
    }, 60_000);
    return () => clearInterval(refreshTimerRef.current);
  }, [currentPage]);

  // ── Functions ──────────────────────────────────────────────

  // loadRequests - fetches requests with loading spinner
  async function loadRequests() {
    setLoading(true);
    setFetchError(false);
    try {
      const result = await getMyRequests(activeFilter, currentPage);
      setRequests(result.requests);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setFetchError(true);
      setRequests([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // loadRequestsSilent - refreshes without loading spinner
  async function loadRequestsSilent() {
    try {
      const result = await getMyRequests(activeFilter, currentPage);
      setRequests(result.requests);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { /* keep previous */ }
    finally { setLoading(false); }
  }

  // handleCancelRequest - cancels a pending request
  // requestId - the _id of the request to cancel
  // NOTE: Cancel endpoint not implemented in this version.
  // The button is shown to the employee but the API call is a placeholder.
  async function handleCancelRequest(requestId) {
    setCancellingId(requestId);
    try {
      // TODO: add a cancel endpoint when backend implements it
      // await cancelRequest(requestId);
      console.log("Cancel request:", requestId, "— endpoint not yet implemented");
    } finally {
      setCancellingId(null);
    }
  }

  // handleFilterChange - changes the active status filter tab
  function handleFilterChange(filter) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  // handlePageChange - navigates to a different page
  function handlePageChange(page) {
    setCurrentPage(page);
  }

  // ── Client-side filtering ──────────────────────────────────
  // Step 1: filter by date range
  const dateFiltered = requests.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= startOfDay(dateFrom) && d <= endOfDay(dateTo);
  });

  // Step 2: filter by status
  const statusFiltered = activeFilter === "all"
    ? dateFiltered
    : dateFiltered.filter((r) => r.status === activeFilter);

  // Step 3: filter by type
  const typeFiltered = typeFilter === "all"
    ? statusFiltered
    : statusFiltered.filter((r) => r.type === typeFilter);

  // Step 4: filter by search text
  const visible = debouncedSearch
    ? typeFiltered.filter((r) => {
        const q = debouncedSearch.toLowerCase();
        return (
          r.currentShift?.shiftTitle?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q)
        );
      })
    : typeFiltered;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-4 md:space-y-5 max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Track your leave and shift requests</p>
        </div>
      </div>

      {/* ── Combined filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-3">
        {/* Date range pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 w-full items-center">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 text-sm border border-gray-300 rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
          <span className="hidden sm:flex items-center justify-center text-gray-400 text-sm px-1">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="w-full h-11 text-sm border border-gray-300 rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>

        {/* Total count */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="text-gray-500">
              <span className="font-bold text-gray-800">{total}</span> total
            </span>
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 flex-1 min-w-0">
            {[["all", "All"], ["leave", "Leave"], ["shift_change", "Shift Change"]].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setTypeFilter(k); setCurrentPage(1); }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  typeFilter === k
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter pills + search */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center">
          {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => handleFilterChange(k)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === k
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-gray-600 hover:bg-slate-200"
              }`}
            >
              {l}
            </button>
          ))}

          {/* Search box */}
          <div className="relative ml-auto min-w-[8rem] flex-shrink-0">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search…"
              className="w-full pl-7 pr-7 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-gray-50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Requests list / table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="hidden md:block"><SkeletonTable rows={5} cols={4} /></div>
            <div className="md:hidden"><SkeletonList count={4} /></div>
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <ErrorState
              title="Failed to load requests"
              description="Could not load your requests. Please try again."
              onRetry={loadRequests}
            />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No requests submitted"
            description="Submit a leave or shift change request to see it here."
          />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList size={38} className="text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium text-sm">No matching requests on this page</p>
            <p className="text-gray-400 text-xs mt-1">Try a different date range or filter</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: MyRequestCard list ── */}
            <div className="md:hidden space-y-3 px-4 pb-2">
              {visible.map((req) => (
                <MyRequestCard
                  key={req._id}
                  request={req}
                  isCancelling={cancellingId === req._id}
                  onCancel={handleCancelRequest}
                />
              ))}
            </div>

            {/* ── DESKTOP: Full table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shift</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason / Note</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Resolved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visible.map((req) => {
                    const typeCfg   = TYPE_CFG[req.type]   || TYPE_CFG.leave;
                    const statusCfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
                    return (
                      <tr key={req._id} className={`transition-all duration-100 hover:brightness-[0.97] cursor-pointer ${statusCfg.row}`}>
                        {/* Type badge */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeCfg.badge}`}>
                            {typeCfg.label}
                          </span>
                        </td>
                        {/* Shift name */}
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">
                            {req.currentShift?.shiftTitle || "—"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(req.currentShift?.shiftStartTime)}</p>
                          {req.requestedShift && (
                            <p className="text-xs text-amber-600 mt-0.5">→ {req.requestedShift.shiftTitle}</p>
                          )}
                        </td>
                        {/* Reason + manager note */}
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-gray-500 italic max-w-[180px] truncate">
                            {req.reason || <span className="not-italic text-gray-300">—</span>}
                          </p>
                          {req.managerNote && (
                            <p className="text-xs text-[#1B3F8B] mt-0.5 truncate max-w-[180px]">
                              Manager: {req.managerNote}
                            </p>
                          )}
                        </td>
                        {/* Status badge */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        {/* Submitted date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-xs font-medium text-gray-700">{fmtDate(req.createdAt)}</p>
                        </td>
                        {/* Resolved date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-xs font-medium text-gray-700">
                            {req.resolvedAt
                              ? fmtDate(req.resolvedAt)
                              : <span className="text-gray-300">—</span>}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer count */}
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{visible.length}</span> on this page ·{" "}
                  <span className="font-semibold text-gray-600">{total}</span> total · auto-refreshes every 60s
                </p>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && !fetchError && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={20}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default MyRequestsPage;
