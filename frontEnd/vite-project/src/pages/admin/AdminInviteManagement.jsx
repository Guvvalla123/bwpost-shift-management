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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invite Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Send and track registration invites</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 bg-[#1B3F8B] hover:bg-[#162d5e] text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
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
          <div className="overflow-x-auto">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Send Invite</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              {role === "employee" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Manager</label>
                  <select
                    required
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]"
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B3F8B] hover:bg-[#162d5e] text-white text-sm font-semibold disabled:opacity-60"
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
