// InvitesPage.jsx
// Admin view: list invites, filter tabs, pagination, send-invite modal.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Mail, Copy } from "lucide-react";
import {
  Pagination,
  SkeletonTable,
  SkeletonList,
  EmptyState,
  ErrorState,
} from "@/components/ui";

import { getAllInvites, getAllManagers } from "./invitesApi";
import InviteCard      from "./InviteCard";
import SendInviteModal from "./SendInviteModal";

// getInviteStatus — matches legacy client-side filter rules
function getInviteStatus(invite) {
  if (invite.usedAt) return "used";
  if (new Date(invite.expiresAt) < new Date()) return "expired";
  return "pending";
}

const STATUS_STYLES = {
  used: { label: "Registered", cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
};

const ROLE_STYLES = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  employee: "bg-slate-100 text-gray-600",
};

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

function InvitesPage() {
  // List of invites from server (current page, unfiltered)
  const [invites, setInvites] = useState([]);

  // True while the main list is loading
  const [loading, setLoading] = useState(true);

  // Error text — empty means no error banner
  const [error, setError] = useState("");

  // Filter tab: all | pending | used | expired (client-side filter like original)
  const [activeFilter, setActiveFilter] = useState("all");

  // Total rows reported by API for pagination
  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(1);

  // Current page index (1-based)
  const [currentPage, setCurrentPage] = useState(1);

  // Managers loaded for the send-invite form when role is employee
  const [managers, setManagers] = useState([]);

  // Send invite modal visibility
  const [showSendModal, setShowSendModal] = useState(false);

  // loadInvites — GET current page from API (filtering is client-side only, like the original page).
  const loadInvites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAllInvites("all", currentPage);
      setInvites(result.invites);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setError("Could not load invites.");
      setInvites([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  // loadManagers — for employee invite dropdown
  async function loadManagers() {
    try {
      const list = await getAllManagers();
      setManagers(list);
    } catch {
      setManagers([]);
    }
  }

  // handleInviteSuccess — refresh table after a new invite is created
  function handleInviteSuccess() {
    loadInvites();
  }

  // handleCopyLink — copy full registration URL and toast
  function handleCopyLink(link) {
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  }

  // handleFilterChange — switch client filter tab
  function handleFilterChange(filter) {
    setActiveFilter(filter);
  }

  // handlePageChange — pagination control
  function handlePageChange(page) {
    setCurrentPage(page);
  }

  // When send modal opens, refresh manager list for dropdown
  useEffect(() => {
    if (showSendModal) loadManagers();
  }, [showSendModal]);

  // Silent background refresh every 60s (replaces useAutoRefresh)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const result = await getAllInvites("all", currentPage);
        setInvites(result.invites);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch {
        /* keep previous */
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [currentPage]);

  const filteredInvites = useMemo(() => {
    if (activeFilter === "all") return invites;
    return invites.filter((inv) => getInviteStatus(inv) === activeFilter);
  }, [invites, activeFilter]);

  function openModal() {
    setShowSendModal(true);
  }

  const fetchError = Boolean(error);

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Invite Management</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Send and track registration invites</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1B3F8B] hover:bg-[#162d5e] text-white rounded-lg px-4 py-3 h-12 text-base font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1"
        >
          + New Invite
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["used", "Used"],
          ["expired", "Expired"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleFilterChange(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 ${
              activeFilter === key ? "bg-[#1B3F8B] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="hidden md:block">
              <SkeletonTable rows={6} cols={6} />
            </div>
            <div className="md:hidden">
              <SkeletonList count={4} />
            </div>
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <ErrorState
              title="Failed to load invites"
              description={error || "Could not load invites. Please try again."}
              onRetry={loadInvites}
            />
          </div>
        ) : invites.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No invites sent yet"
            description="Send your first invite to add team members."
            actionLabel="New Invite"
            onAction={openModal}
          />
        ) : filteredInvites.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No invites match this filter on this page.</div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-3">
              {filteredInvites.map((inv) => (
                <InviteCard
                  key={inv._id}
                  invite={inv}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvites.map((inv) => {
                    const st = getInviteStatus(inv);
                    const stCfg = STATUS_STYLES[st];
                    const disabledCopy = st !== "pending";
                    const link = `${window.location.origin}/register?invite=${inv.token}`;
                    return (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors duration-100">
                        <td className="px-4 py-3 font-medium text-gray-800">{inv.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_STYLES[inv.role] || "bg-slate-100 text-gray-600"}`}>
                            {inv.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${stCfg.cls}`}>{stCfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(inv.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(inv.expiresAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={disabledCopy}
                            onClick={() => handleCopyLink(link)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy Link
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
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

      <SendInviteModal
        isOpen={showSendModal}
        managers={managers}
        onClose={() => setShowSendModal(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}

export default InvitesPage;
