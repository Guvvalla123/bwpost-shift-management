import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "@/api";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Mail, Copy } from "lucide-react";
import { Pagination, SkeletonTable, SkeletonList, EmptyState, ErrorState, Modal, Input, Button, Badge } from "@/components/ui";

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
  employee: "bg-slate-100 text-gray-600",
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

  const fetchInvitesSilent = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
      const res = await API.get(`/api/invites?${params}`);
      const { data, pagination } = res.data;
      setInvites(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(pagination?.total ?? 0);
    } catch {
      /* silent — keep previous data */
    }
  }, [currentPage]);

  useAutoRefresh(fetchInvitesSilent, 60_000);

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
            onClick={() => setFilterTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 ${
              filterTab === key ? "bg-[#1B3F8B] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
            <ErrorState title="Failed to load invites" description="Could not load invites. Please try again." onRetry={fetchInvites} />
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
              {filteredInvites.map((inv) => {
                const st = getInviteStatus(inv);
                const stCfg = STATUS_STYLES[st];
                const borderCls =
                  st === "pending"
                    ? "border-l-4 border-l-amber-500"
                    : st === "used"
                    ? "border-l-4 border-l-green-500"
                    : "border-l-4 border-l-red-400";
                const statusVariant =
                  st === "pending" ? "warning" : st === "used" ? "success" : "error";
                const roleVariant = inv.role === "manager" ? "navy" : "success";
                const expiresAt = new Date(inv.expiresAt);
                const hoursUntilExpiry = (expiresAt - new Date()) / (1000 * 60 * 60);
                const expiringSoon = st === "pending" && hoursUntilExpiry <= 24;
                return (
                  <div
                    key={inv._id}
                    className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 ${borderCls}`}
                  >
                    {/* TOP ROW: email + status badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-bold text-sm text-gray-900 break-all flex-1 min-w-0">{inv.email}</p>
                      <Badge variant={statusVariant} size="sm" className="shrink-0">
                        {stCfg.label}
                      </Badge>
                    </div>
                    {/* SECOND ROW: role badge + expiry */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant={roleVariant} size="sm">
                        {inv.role?.charAt(0).toUpperCase() + inv.role?.slice(1)}
                      </Badge>
                      {st === "pending" && (
                        <span className={`text-xs ${expiringSoon ? "text-red-500 font-medium" : "text-gray-400"}`}>
                          Expires {fmtDate(inv.expiresAt)}
                        </span>
                      )}
                    </div>
                    {/* THIRD ROW: sent date */}
                    <p className="text-xs text-gray-400 mb-3">Sent {fmtDate(inv.createdAt)}</p>
                    {/* BOTTOM ROW */}
                    <div className="border-t border-gray-100 pt-3">
                      {st === "pending" && (
                        <button
                          type="button"
                          onClick={() => copyLink(inv.token)}
                          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#1B3F8B]/30 text-[#1B3F8B] text-sm font-semibold hover:bg-[#EFF6FF] transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                        >
                          <Copy className="w-4 h-4 shrink-0" />
                          Copy Link
                        </button>
                      )}
                      {st === "used" && (
                        <p className="text-sm text-gray-400 text-center">Link used</p>
                      )}
                      {st === "expired" && (
                        <p className="text-sm text-gray-400 text-center">Expired</p>
                      )}
                    </div>
                  </div>
                );
              })}
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
                            onClick={() => copyLink(inv.token)}
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
            totalItems={totalItems}
            pageSize={20}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Send Invite"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="invite-send-form"
              loading={submitting}
              loadingText="Sending"
            >
              Send Invite
            </Button>
          </>
        }
      >
        <form id="invite-send-form" onSubmit={handleSubmitInvite} className="space-y-4">
          <Input
            id="invite-email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B]"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
              <select
                required
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B]"
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
        </form>
      </Modal>
    </div>
  );
};

export default AdminInviteManagement;
