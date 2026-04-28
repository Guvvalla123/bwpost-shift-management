// RequestsPage.jsx
// Main shift requests management page for managers.
// Shows all shift requests from employees (leave and shift-change).
// Manager can approve or reject each pending request.
//
// THIS FILE ONLY MANAGES STATE AND DATA.
// UI pieces are in separate component files:
// - RequestCard.jsx     shows one request as a card on mobile
// - RequestTableRow.jsx shows one request as a table row on desktop
// - RejectNoteModal.jsx modal for rejecting with optional note

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  Pagination, SkeletonTable, SkeletonList,
  EmptyState, ErrorState, KpiCard,
} from "@/components/ui";
import {
  ClipboardList, CheckCircle, CheckCircle2, XCircle,
  Calendar, Search, X, Clock,
} from "lucide-react";

// Import API functions from the dedicated API module
import {
  getAllRequests,
  getRequestCounts,
  approveRequest,
  rejectRequest,
} from "./requestApi";

// Import UI sub-components
import RequestCard     from "./RequestCard";
import RequestTableRow from "./RequestTableRow";
import RejectNoteModal from "./RejectNoteModal";

// ── Date helpers ───────────────────────────────────────────────
// fmtDate - converts ISO date to short readable string
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
}

// toInput - converts date to YYYY-MM-DD for date input value
function toInput(d) { return new Date(d).toISOString().split("T")[0]; }

// startOfDay - returns midnight of a given date string
function startOfDay(s) { const d = new Date(s); d.setHours(0, 0, 0, 0); return d; }

// endOfDay - returns end of day (23:59:59) for a given date string
function endOfDay(s) { const d = new Date(s); d.setHours(23, 59, 59, 999); return d; }

// defaultFrom - returns date 30 days ago as YYYY-MM-DD
function defaultFrom() { const d = new Date(); d.setDate(d.getDate() - 30); return toInput(d); }

// ── Main Component ─────────────────────────────────────────────
const RequestsPage = () => {
  // List of requests loaded from the server
  const [requests, setRequests] = useState([]);

  // True while loading the requests list
  const [loading, setLoading] = useState(true);

  // True if the last load failed
  const [fetchError, setFetchError] = useState(false);

  // Total items count returned by server (for pagination)
  const [totalItems, setTotalItems] = useState(0);

  // Total pages for pagination
  const [totalPages, setTotalPages] = useState(1);

  // Current page number
  const [currentPage, setCurrentPage] = useState(1);

  // Currently selected STATUS filter sent to API
  // "all" | "pending" | "approved" | "rejected"
  const [statusFilter, setStatusFilter] = useState("all");

  // Currently selected TYPE filter sent to API
  // "all" | "leave" | "shift_change"
  const [typeFilter, setTypeFilter] = useState("all");

  // Date range filter applied CLIENT-SIDE after API fetch
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo,   setDateTo]   = useState(() => toInput(new Date()));

  // Search text for client-side filtering by name/shift/reason
  const [search, setSearch] = useState("");

  // Debounced version of search (300ms delay)
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Counts for each status tab badge
  const [statusCounts, setStatusCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });

  // ID of the request currently being processed
  // Used to disable buttons on that specific row/card during API call
  const [processingId, setProcessingId] = useState(null);

  // Request being rejected — when set, RejectNoteModal opens
  const [requestToReject, setRequestToReject] = useState(null);

  // Auto-refresh interval reference
  const refreshTimerRef = useRef(null);

  // ── Debounce search input ──────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load requests when filters or page changes ─────────────
  useEffect(() => {
    loadRequests();
    loadCounts();
  }, [currentPage, statusFilter, typeFilter]);

  // ── Auto-refresh every 60 seconds ─────────────────────────
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      loadRequestsSilent();
      loadCounts();
    }, 60_000);
    return () => clearInterval(refreshTimerRef.current);
  }, [currentPage, statusFilter, typeFilter]);

  // ── Functions ──────────────────────────────────────────────

  // loadRequests - fetches requests with a loading spinner
  async function loadRequests() {
    setLoading(true);
    setFetchError(false);
    try {
      const result = await getAllRequests(statusFilter, typeFilter, currentPage);
      setRequests(result.requests);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch {
      setFetchError(true);
      setRequests([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  // loadRequestsSilent - refreshes without showing loading spinner
  async function loadRequestsSilent() {
    try {
      const result = await getAllRequests(statusFilter, typeFilter, currentPage);
      setRequests(result.requests);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch { /* keep previous data */ }
  }

  // loadCounts - fetches counts for each status tab badge
  async function loadCounts() {
    try {
      const counts = await getRequestCounts();
      setStatusCounts(counts);
    } catch { /* keep previous counts */ }
  }

  // handleApprove - directly approves a request without showing a modal
  // requestObj - the full request object (needs _id and employee info)
  async function handleApprove(requestObj) {
    setProcessingId(requestObj._id);
    try {
      await approveRequest(requestObj._id);
      toast.success("Request approved");
      loadRequests();
      loadCounts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to approve request"));
    } finally {
      setProcessingId(null);
    }
  }

  // handleRejectClick - opens the RejectNoteModal for a request
  // requestObj - the request to reject (shown in modal summary)
  function handleRejectClick(requestObj) {
    setRequestToReject(requestObj);
  }

  // handleConfirmReject - called when manager confirms rejection in modal
  // note - the optional manager note typed in RejectNoteModal
  async function handleConfirmReject(note) {
    if (!requestToReject) return;
    setProcessingId(requestToReject._id);
    try {
      await rejectRequest(requestToReject._id, note);
      toast.success("Request rejected");
      setRequestToReject(null);
      loadRequests();
      loadCounts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to reject request"));
    } finally {
      setProcessingId(null);
    }
  }

  // handleTabChange - changes the active status filter tab
  // tab - the new status value: "all" | "pending" | "approved" | "rejected"
  function handleTabChange(tab) {
    setStatusFilter(tab);
    setCurrentPage(1);
  }

  // ── Client-side filtering after API fetch ──────────────────
  // Filter by date range first, then by search text
  const dateFiltered = requests.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= startOfDay(dateFrom) && d <= endOfDay(dateTo);
  });

  const visible = debouncedSearch
    ? dateFiltered.filter((r) => {
        const q = debouncedSearch.toLowerCase();
        return (
          r.employee?.username?.toLowerCase().includes(q) ||
          r.currentShift?.shiftTitle?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q)
        );
      })
    : dateFiltered;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-5 bg-[#F8F9FC] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Shift Requests</h1>
        <p className="mt-1 text-sm text-gray-400">Review and manage staff requests</p>
      </div>

      {/* ── KPI stat cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard variant="amber"   icon={Clock}       label="Pending"  value={statusCounts.pending} />
        <KpiCard variant="green"   icon={CheckCircle2} label="Approved" value={statusCounts.approved} />
        <KpiCard variant="default" icon={XCircle}      label="Rejected" value={statusCounts.rejected} />
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
              className="w-full h-11 text-sm border border-gray-300 rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB]"
            />
          </div>
          <span className="hidden sm:flex items-center justify-center text-gray-400 text-sm px-1">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="w-full h-11 text-sm border border-gray-300 rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB]"
          />
        </div>

        {/* Total count */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            Total <span className="font-bold text-gray-800">{totalItems}</span>
          </span>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center">
          {[["all", "All"], ["leave", "Leave"], ["shift_change", "Shift Change"]].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => { setTypeFilter(k); setCurrentPage(1); }}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === k
                  ? "bg-[#1B3F8B] text-white shadow-sm"
                  : "bg-slate-100 text-gray-600 hover:bg-slate-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Status filter pills + search box */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center">
          {[
            ["all",      "All",      statusCounts.all],
            ["pending",  "Pending",  statusCounts.pending],
            ["approved", "Approved", statusCounts.approved],
            ["rejected", "Rejected", statusCounts.rejected],
          ].map(([k, l, c]) => (
            <button
              key={k}
              type="button"
              onClick={() => handleTabChange(k)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === k
                  ? "bg-[#1B3F8B] text-white shadow-sm"
                  : "bg-slate-100 text-gray-600 hover:bg-slate-200"
              }`}
            >
              {l}
              <span className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                statusFilter === k ? "bg-white/20 text-white" : "bg-white text-gray-500"
              }`}>
                {c}
              </span>
            </button>
          ))}

          {/* Search box — positioned at far right */}
          <div className="relative ml-auto min-w-[8rem] flex-shrink-0">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search…"
              className="w-full pl-7 pr-7 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40 focus:border-[#2563EB] bg-gray-50"
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

      {/* ── Requests table/card area ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="hidden md:block"><SkeletonTable rows={6} cols={5} /></div>
            <div className="md:hidden"><SkeletonList count={4} /></div>
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <ErrorState
              title="Failed to load requests"
              description="Could not fetch shift requests. Please try again."
              onRetry={loadRequests}
            />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No pending requests"
            description="All shift requests have been reviewed."
          />
        ) : visible.length === 0 ? (
          /* No results after client-side date/search filter */
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList size={38} className="text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium text-sm">No matching requests</p>
            <p className="text-gray-400 text-xs mt-1">Try a different search or date range</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: RequestCard list ── */}
            <div className="space-y-3 px-4 pb-2 md:hidden">
              {visible.map((req) => (
                <RequestCard
                  key={req._id}
                  request={req}
                  isProcessing={processingId === req._id}
                  onApprove={handleApprove}
                  onReject={handleRejectClick}
                />
              ))}
            </div>

            {/* ── DESKTOP: Full table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shift</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visible.map((req) => (
                    <RequestTableRow
                      key={req._id}
                      request={req}
                      isProcessing={processingId === req._id}
                      onApprove={handleApprove}
                      onReject={handleRejectClick}
                    />
                  ))}
                </tbody>
              </table>

              {/* Footer showing count */}
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{visible.length}</span> on this page ·{" "}
                  <span className="font-semibold text-gray-600">{totalItems}</span> total · auto-refreshes every 60s
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
            totalItems={totalItems}
            pageSize={20}
            onPageChange={(p) => setCurrentPage(p)}
            isLoading={loading}
          />
        )}
      </div>

      {/* ── Reject Note Modal ── */}
      {/* Opens when manager clicks Reject on a request */}
      <RejectNoteModal
        isOpen={!!requestToReject}
        request={requestToReject}
        onConfirm={handleConfirmReject}
        onCancel={() => setRequestToReject(null)}
      />
    </div>
  );
};

export default RequestsPage;
