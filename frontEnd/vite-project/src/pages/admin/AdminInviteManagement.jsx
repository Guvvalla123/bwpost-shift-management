import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Mail, Copy, X, Loader2 } from "lucide-react";
import { Pagination, SkeletonTable, EmptyState, ErrorState } from "@/components/ui";

const getInviteStatus = (invite) => {
  if (invite.usedAt) return "used";
  if (new Date(invite.expiresAt) < new Date()) return "expired";
  return "pending";
};

const STATUS_STYLES = {
  used: { label: "Registered", cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
};

const ROLE_STYLES = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  employee: "bg-slate-100 text-slate-600",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const AdminInviteManagement = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterTab, setFilterTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
      const res = await API.get(`/api/invites?${params}`);
      const { data, pagination } = res.data;
      setInvites(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(pagination?.total ?? 0);
    } catch {
      setFetchError(true);
      setInvites([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const loadManagers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ role: "manager", page: "1", limit: "50" });
      const res = await API.get(`/api/admin/users?${params}`);
      const raw = res.data?.data;
      setManagers(Array.isArray(raw) ? raw : []);
    } catch {
      setManagers([]);
    }
  }, []);

  useEffect(() => {
    if (showModal) loadManagers();
  }, [showModal, loadManagers]);

  const filteredInvites = useMemo(() => {
    if (filterTab === "all") return invites;
    return invites.filter((inv) => getInviteStatus(inv) === filterTab);
  }, [invites, filterTab]);

  const openModal = () => {
    setEmail("");
    setRole("employee");
    setManagerId("");
    setShowModal(true);
  };

  const handleSubmitInvite = async (e) => {
    e.preventDefault();
    if (role === "employee" && !managerId) {
      toast.error("Select a manager for employee invites");
      return;
    }
    setSubmitting(true);
    try {
      const body = { email: email.trim(), role };
      if (role === "employee") body.managerId = managerId;
      await API.post("/api/invites", body);
      toast.success("Invite sent");
      setShowModal(false);
      fetchInvites();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create invite"));
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = (token) => {
    const link = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Invite Management</h1>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">Send and track registration invites</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1B3F8B] hover:bg-[#162d5e] text-white rounded-lg px-4 py-3 h-12 text-base font-semibold transition-colors"
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
            onClick={() => setFilterTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterTab === key ? "bg-[#1B3F8B] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={6} cols={6} />
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <ErrorState title="Failed to load invites" message="Could not load invites." onRetry={fetchInvites} />
          </div>
        ) : invites.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No invites found"
            message="Send your first invite to onboard a team member."
            action={{ label: "Send Invite", onClick: openModal }}
          />
        ) : filteredInvites.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No invites match this filter on this page.</div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-3">
              {filteredInvites.map((inv) => {
                const st = getInviteStatus(inv);
                const stCfg = STATUS_STYLES[st];
                const disabledCopy = st !== "pending";
                const linkPreview = `${typeof window !== "undefined" ? window.location.origin : ""}/register?invite=${inv.token}`;
                return (
                  <div
                    key={inv._id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm break-all">{inv.email}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate" title={linkPreview}>
                          {linkPreview}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${stCfg.cls}`}>
                        {stCfg.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Role:</span>{" "}
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_STYLES[inv.role] || "bg-slate-100 text-slate-600"}`}>
                          {inv.role}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Created:</span>{" "}
                        <span className="text-slate-800">{fmtDate(inv.createdAt)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Expires:</span>{" "}
                        <span className="text-slate-800">{fmtDate(inv.expiresAt)}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={disabledCopy}
                        onClick={() => copyLink(inv.token)}
                        className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Copy className="w-4 h-4 shrink-0" />
                        Copy invite link
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvites.map((inv) => {
                    const st = getInviteStatus(inv);
                    const stCfg = STATUS_STYLES[st];
                    const disabledCopy = st !== "pending";
                    return (
                      <tr key={inv._id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-800">{inv.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_STYLES[inv.role] || "bg-slate-100 text-slate-600"}`}>
                            {inv.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${stCfg.cls}`}>{stCfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(inv.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(inv.expiresAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={disabledCopy}
                            onClick={() => copyLink(inv.token)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
            totalItems={totalItems}
            pageSize={20}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4 bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" aria-hidden />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-slate-900">Send Invite</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]"
                  placeholder="name@company.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              {role === "employee" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                  <select
                    required
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]"
                  >
                    <option value="">— Select manager —</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.username} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-12"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1B3F8B] hover:bg-[#162d5e] text-white text-base font-semibold disabled:opacity-60 min-h-12"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInviteManagement;
