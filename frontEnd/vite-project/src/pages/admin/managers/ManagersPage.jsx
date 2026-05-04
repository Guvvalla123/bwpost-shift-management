// ManagersPage.jsx
// Admin page for listing, inviting, and creating managers.

import React, { useState, useEffect, useCallback } from "react";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "sonner";
import {
  Pagination, SkeletonTable, SkeletonList, EmptyState, ErrorState, Modal, Button,
} from "@/components/ui";
import { UserPlus, Search, Briefcase, Mail, UserCheck } from "lucide-react";
import ManagerRow from "./components/ManagerRow";

import {
  getAllManagers,
  addManager,
  deactivateManager,
  generateResetLink,
  createManagerInvite,
} from "./managersApi";

import ManagerCard           from "./ManagerCard";
import AddManagerModal         from "./AddManagerModal";
import InviteManagerModal      from "./InviteManagerModal";
import ManagerDetailsDrawer    from "./ManagerDetailsDrawer";

// StatCard — KPI style card matching the original page
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5">{value}</p>
      </div>
    </div>
  );
}

const ManagersPage = () => {
  // List of managers from server for the current filters
  const [managers, setManagers] = useState([]);

  // True while fetching the main list (initial + filter changes)
  const [loading, setLoading] = useState(true);

  // When true the table area shows ErrorState retry
  const [fetchError, setFetchError] = useState(false);

  // Total count from pagination meta (shown in header)
  const [total, setTotal] = useState(0);

  // Total pages returned by API
  const [totalPages, setTotalPages] = useState(1);

  // Current page index (pagination)
  const [currentPage, setCurrentPage] = useState(1);

  // Search box text — debounced into debouncedSearch
  const [searchText, setSearchText] = useState("");

  // Debounced search string actually sent to the API (300 ms after typing stops)
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // When Add Manager modal is visible
  const [showAddModal, setShowAddModal] = useState(false);

  // When Invite modal is visible
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Add-manager form payload
  const [addForm, setAddForm] = useState({ username: "", email: "", password: "" });

  const [inviteEmail, setInviteEmail] = useState("");

  // True while submitting add-manager form
  const [submitting, setSubmitting] = useState(false);

  // True while inviting
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // After invite created — link string for copy UI
  const [createdInviteLink, setCreatedInviteLink] = useState(null);

  // Checkbox: show deactivated managers in the list (same behaviour as original)
  const [includeInactive, setIncludeInactive] = useState(false);

  // Selected manager for the slide-in details drawer — null hides drawer
  const [selectedManager, setSelectedManager] = useState(null);

  // Manager selected after reset-link API succeeds — drives reset modal visibility
  const [managerForReset, setManagerForReset] = useState(null);

  // Generated reset URL displayed in confirmation modal
  const [resetLink, setResetLink] = useState("");

  // True while deactivate request runs
  const [deletingId, setDeletingId] = useState(null);

  // ── Debounce search (replacing useDebounce hook per project rules)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // ── Escape key closes details drawer only
  useEffect(() => {
    const h = (e) => {
      if (e.key !== "Escape") return;
      if (selectedManager) setSelectedManager(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selectedManager]);

  // loadManagers — loads list whenever page/search/includeInactive/debounced search changes
  const loadManagers = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const result = await getAllManagers(currentPage, debouncedSearch, includeInactive);
      setManagers(result.managers);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setFetchError(true);
      setManagers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, includeInactive]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  // Silent background refresh — same intervals as original useAutoRefresh
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const result = await getAllManagers(currentPage, debouncedSearch, includeInactive);
        setManagers(result.managers);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch { /* keep stale data */ }
    }, 60_000);
    return () => clearInterval(id);
  }, [currentPage, debouncedSearch, includeInactive]);

  // ── Actions ─────────────────────────────────────────────

  async function handleAddSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addManager(addForm);
      toast.success("Manager created successfully");
      setShowAddModal(false);
      setAddForm({ username: "", email: "", password: "" });
      loadManagers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create manager"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    setInviteSubmitting(true);
    setCreatedInviteLink(null);
    try {
      const res = await createManagerInvite(inviteEmail);
      // Same shape as original: axios body has nested data.inviteLink
      const link = res?.data?.inviteLink;
      setCreatedInviteLink(link);
      toast.success("Invite created");
      if (link) {
        navigator.clipboard?.writeText(link).then(() => toast.success("Invite link copied"));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create invite"));
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleDeactivate(managerId) {
    const ok = window.confirm("Deactivate this manager? They will not be able to sign in.");
    if (!ok) return;
    setDeletingId(managerId);
    try {
      await deactivateManager(managerId);
      toast.success("Manager deactivated");
      loadManagers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to deactivate manager"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleResetPassword(manager) {
    try {
      const data = await generateResetLink(manager._id);
      setResetLink(data?.resetLink || "");
      setManagerForReset(manager);
      if (data?.resetLink) {
        navigator.clipboard?.writeText(data.resetLink).then(() => toast.success("Reset link copied"));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate reset link"));
    }
  }

  function handleAddFieldChange(e) {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const activeCount = managers.filter((m) => m.isActive !== false).length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and invite system managers</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setShowInviteModal(true); setCreatedInviteLink(null); setInviteEmail(""); }}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 bg-white border border-blue-300 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-150 active:scale-95 text-sm"
            >
              <Mail className="w-4 h-4" /> Invite Manager
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 bg-[#1B3F8B] text-white font-semibold rounded-xl hover:bg-[#162d5e] transition-all duration-150 active:scale-95 text-sm"
            >
              <UserPlus className="w-4 h-4" /> Add Manager
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Briefcase} label="Total Managers" value={total} color="bg-gradient-to-br from-blue-600 to-[#162d5e]" />
          <StatCard icon={UserCheck} label="Active" value={activeCount} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              All Managers
              <span className="ml-2 text-xs font-medium text-gray-400">({total})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => {
                    setIncludeInactive(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded"
                />
                Include deactivated
              </label>
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="hidden md:block"><SkeletonTable rows={6} cols={4} /></div>
              <div className="md:hidden"><SkeletonList count={5} /></div>
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load managers"
                description="Could not fetch manager list. Please try again."
                onRetry={loadManagers}
              />
            </div>
          ) : managers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No managers yet"
              description="Invite your first manager to get started."
              actionLabel="Invite Manager"
              onAction={() => { setShowInviteModal(true); setCreatedInviteLink(null); setInviteEmail(""); }}
            />
          ) : (
            <>
              <div className="md:hidden space-y-3 px-4 pb-4">
                {managers.map((m) => (
                  <ManagerCard
                    key={m._id}
                    manager={m}
                    onViewDetails={(mgr) => setSelectedManager(mgr)}
                    onDeactivate={(id) => handleDeactivate(id)}
                    onResetPassword={(mgr) => handleResetPassword(mgr)}
                  />
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {managers.map((mgr) => (
                      <ManagerRow
                        key={mgr._id}
                        manager={mgr}
                        onView={setSelectedManager}
                        onResetPassword={handleResetPassword}
                        onDelete={
                          deletingId === mgr._id
                            ? undefined
                            : (m) => handleDeactivate(m._id)
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                pageSize={20}
                onPageChange={setCurrentPage}
                isLoading={loading}
              />
            </>
          )}
        </div>
      </div>

      <InviteManagerModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setCreatedInviteLink(null);
          setInviteEmail("");
        }}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onSubmit={handleInviteSubmit}
        inviteSubmitting={inviteSubmitting}
        createdInviteLink={createdInviteLink}
      />

      <AddManagerModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setAddForm({ username: "", email: "", password: "" }); }}
        form={addForm}
        onChange={handleAddFieldChange}
        onSubmit={handleAddSubmit}
        submitting={submitting}
      />

      <ManagerDetailsDrawer
        manager={selectedManager}
        onClose={() => setSelectedManager(null)}
      />

      {/* Reset-password link modal (after API succeeds) */}
      <Modal
        isOpen={!!managerForReset}
        onClose={() => { setManagerForReset(null); setResetLink(""); }}
        title="Password reset link"
        footer={
          <Button
            variant="outline"
            type="button"
            fullWidth
            onClick={() => { setManagerForReset(null); setResetLink(""); }}
          >
            Close
          </Button>
        }
      >
        {managerForReset && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Share this link with <span className="font-semibold">{managerForReset.username}</span>:
            </p>
            <textarea
              readOnly
              className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"
              value={resetLink}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagersPage;
