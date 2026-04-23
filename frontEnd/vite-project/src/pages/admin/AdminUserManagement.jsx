import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage, unwrapSuccessData } from "@/utils/apiError";
import { UserPlus, Search, X, Shield, Users, UserCheck, Mail, Copy, Pencil, Key, Trash2 } from "lucide-react";
import { Pagination, SkeletonTable, SkeletonList, EmptyState, ErrorState, KpiCard, Modal, Input, Button, Badge } from "@/components/ui";

const ROLE_BADGES = {
  admin: "bg-purple-50 text-purple-700 border border-purple-200",
  manager: "bg-[#EFF6FF] text-[#1B3F8B] border border-blue-100",
  employee: "bg-emerald-50 text-emerald-800 border border-emerald-100",
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "employee", managerId: "" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "employee", managerId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roleForm, setRoleForm] = useState({ role: "employee", managerId: "" });
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const [pwdResetConfirmUser, setPwdResetConfirmUser] = useState(null);
  const [pwdResetResult, setPwdResetResult] = useState(null);
  const [pwdResetLoading, setPwdResetLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAll: 0,
    active: 0,
    inactive: 0,
    admin: 0,
    manager: 0,
    employee: 0,
  });
  const debouncedSearch = useDebounce(search, 300);

  const fetchStats = useCallback(async () => {
    try {
      const [allInc, activeOnly, ad, mg, em] = await Promise.all([
        API.get("/api/admin/users?page=1&limit=1&includeInactive=true"),
        API.get("/api/admin/users?page=1&limit=1"),
        API.get("/api/admin/users?page=1&limit=1&role=admin&includeInactive=true"),
        API.get("/api/admin/users?page=1&limit=1&role=manager&includeInactive=true"),
        API.get("/api/admin/users?page=1&limit=1&role=employee&includeInactive=true"),
      ]);
      const totalAll = allInc.data?.pagination?.total ?? 0;
      const active = activeOnly.data?.pagination?.total ?? 0;
      setStats({
        totalAll,
        active,
        inactive: Math.max(0, totalAll - active),
        admin: ad.data?.pagination?.total ?? 0,
        manager: mg.data?.pagination?.total ?? 0,
        employee: em.data?.pagination?.total ?? 0,
      });
    } catch {
      /* keep previous */
    }
  }, []);

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError(false);
    }
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      if (includeInactive) params.set("includeInactive", "true");
      const res = await API.get(`/api/admin/users?${params}`);
      const { data, pagination } = res.data;
      setUsers(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(pagination?.total ?? 0);
    } catch {
      if (!silent) setFetchError(true);
      if (!silent) {
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentPage, debouncedSearch, roleFilter, includeInactive]);

  useEffect(() => {
    fetchUsers(false);
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchUsersSilent = useCallback(() => {
    fetchStats();
    fetchUsers(true);
  }, [fetchStats, fetchUsers]);

  useAutoRefresh(fetchUsersSilent, 60_000);

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    if (roleForm.role === "employee" && !roleForm.managerId) {
      toast.error("Employees must be assigned to a manager");
      return;
    }
    setRoleSubmitting(true);
    try {
      const payload = { role: roleForm.role };
      if (roleForm.role === "employee") payload.managerId = roleForm.managerId;
      await API.put(`/api/admin/users/${roleModalUser._id}/role`, payload);
      toast.success("Role updated successfully");
      setRoleModalUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update role"));
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.role === "employee" && !form.managerId) {
      toast.error("Employees must be assigned to a manager");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (form.role !== "employee") delete payload.managerId;
      await API.post("/api/admin/users", payload);
      toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} created successfully`);
      setModalOpen(false);
      setForm({ username: "", email: "", password: "", role: "employee", managerId: "" });
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create user"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (inviteForm.role === "employee" && !inviteForm.managerId) {
      toast.error("Employees must be assigned to a manager");
      return;
    }
    setInviteSubmitting(true);
    setCreatedInviteLink(null);
    try {
      const payload = { email: inviteForm.email, role: inviteForm.role };
      if (inviteForm.role === "employee") payload.managerId = inviteForm.managerId;
      const res = await API.post("/api/invites", payload);
      const link = res.data?.data?.inviteLink;
      setCreatedInviteLink(link);
      toast.success("Invite created");
      if (link) {
        navigator.clipboard?.writeText(link).then(() => toast.success("Invite link copied to clipboard"));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create invite"));
    } finally {
      setInviteSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (createdInviteLink) {
      navigator.clipboard?.writeText(createdInviteLink).then(() => toast.success("Copied to clipboard"));
    }
  };

  const copyPwdResetLink = async () => {
    if (!pwdResetResult?.resetLink) return;
    try {
      await navigator.clipboard.writeText(pwdResetResult.resetLink);
      toast.success("Link copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = pwdResetResult.resetLink;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success("Link copied to clipboard");
      } catch {
        toast.error("Could not copy to clipboard");
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const confirmAdminPwdReset = async () => {
    if (!pwdResetConfirmUser) return;
    setPwdResetLoading(true);
    try {
      const res = await API.post(`/api/admin/users/${pwdResetConfirmUser._id}/reset-password-link`);
      const data = unwrapSuccessData(res);
      setPwdResetConfirmUser(null);
      setPwdResetResult(data);
      toast.success("Password reset link generated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate link"));
    } finally {
      setPwdResetLoading(false);
    }
  };

  const shareWhatsApp = () => {
    if (!pwdResetResult?.resetLink) return;
    const text = `Your password reset link (expires in 1 hour): ${pwdResetResult.resetLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const inputCls =
    "w-full h-12 px-4 rounded-xl border border-gray-300 text-base focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 md:text-sm";

  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all system users</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => { setInviteModalOpen(true); setCreatedInviteLink(null); }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 bg-white border border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition text-sm"
            >
              <Mail className="w-4 h-4" /> Invite User
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md transition text-sm"
            >
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard variant="navy" icon={Users} label="Total Users" value={stats.totalAll} />
          <KpiCard variant="green" icon={UserCheck} label="Active Users" value={stats.active} />
          <KpiCard variant="amber" icon={UserCheck} label="Inactive Users" value={stats.inactive} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              {[
                ["", "All", stats.totalAll],
                ["admin", "Admin", stats.admin],
                ["manager", "Manager", stats.manager],
                ["employee", "Employee", stats.employee],
              ].map(([key, label, count]) => (
                <button
                  key={key || "all"}
                  type="button"
                  onClick={() => {
                    setRoleFilter(key);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all sm:px-4 ${
                    roleFilter === key
                      ? "bg-[#1B3F8B] text-white shadow-sm"
                      : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      roleFilter === key ? "bg-white/20 text-white" : "bg-white text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:ml-auto sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
                aria-label="Search users"
              />
              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-600 sm:ml-0">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked);
                  setCurrentPage(1);
                }}
                className="h-4 w-4 shrink-0 rounded"
              />
              Include deactivated
            </label>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <SkeletonTable rows={8} cols={5} />
              </div>
              <div className="md:hidden">
                <SkeletonList count={5} />
              </div>
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load users"
                description="Could not fetch user list. Please try again."
                onRetry={fetchUsers}
              />
            </div>
          ) : (
            <>
              {users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No users found"
                  description="Create your first user to get started."
                  actionLabel="Add user"
                  onAction={() => setModalOpen(true)}
                />
              ) : (
                <>
              <div className="md:hidden space-y-3 px-4 pb-4">
                {users.map((u) => {
                  const avatarBg =
                    u.role === "admin"
                      ? "bg-purple-600"
                      : u.role === "manager"
                      ? "bg-[#1B3F8B]"
                      : "bg-green-600";
                  return (
                    <div
                      key={u._id}
                      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 ${u.isActive === false ? "opacity-70" : ""}`}
                    >
                      {/* TOP ROW: avatar + name/email + active badge */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold ${avatarBg}`}>
                          {u.username?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{u.username}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <Badge variant={u.isActive !== false ? "success" : "gray"} size="sm">
                          {u.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {/* SECOND ROW: role badge + joined date */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGES[u.role] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {u.role === "admin" && <Shield size={10} />}
                          {u.role === "manager" && <Users size={10} />}
                          {u.role === "employee" && <UserCheck size={10} />}
                          {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                        </span>
                        {u.createdAt && (
                          <span className="text-xs text-gray-400">
                            Joined {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      {/* BOTTOM ROW: icon action buttons */}
                      <div className="flex items-center justify-end gap-0.5 border-t border-gray-100 pt-3">
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            title="Generate reset link"
                            onClick={() => setPwdResetConfirmUser(u)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1B3F8B] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        )}
                        {u.isActive !== false && (
                          <button
                            type="button"
                            title="Change role"
                            onClick={() => { setRoleModalUser(u); setRoleForm({ role: u.role, managerId: u.managerId?._id || u.managerId || "" }); }}
                            className="p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        )}
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            title="Delete user"
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u) => (
                        <tr key={u._id} className={`hover:bg-slate-50/50 transition-colors duration-100 ${u.isActive === false ? "opacity-60" : ""}`}>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{u.username}</p>
                            {u.isActive === false && <span className="text-xs text-amber-600">Deactivated</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGES[u.role] || "bg-slate-100 text-gray-600"}`}>
                              {u.role === "admin" && <Shield size={12} />}
                              {u.role === "manager" && <Users size={12} />}
                              {u.role === "employee" && <UserCheck size={12} />}
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {u.role !== "admin" && (
                                <button
                                  type="button"
                                  onClick={() => setPwdResetConfirmUser(u)}
                                  className="p-2 text-gray-500 hover:text-[#1B3F8B] hover:bg-[#EFF6FF] rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                                  title="Generate Reset Link"
                                >
                                  <Key size={16} />
                                </button>
                              )}
                              {u.isActive !== false && (
                                <button
                                  type="button"
                                  onClick={() => { setRoleModalUser(u); setRoleForm({ role: u.role, managerId: u.managerId?._id || u.managerId || "" }); }}
                                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                  title="Change role"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
                </>
              )}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={20}
                onPageChange={setCurrentPage}
                isLoading={loading}
              />
            </>
          )}
        </div>
      </div>

      {/* Change Role Modal */}
      <Modal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        title="Change Role"
        description={roleModalUser ? `Updating role for ${roleModalUser.username} (${roleModalUser.email})` : ""}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setRoleModalUser(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="admin-change-role-form"
              loading={roleSubmitting}
              loadingText="Updating"
            >
              Update Role
            </Button>
          </>
        }
      >
        <form id="admin-change-role-form" onSubmit={handleRoleChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
            <select
              value={roleForm.role}
              onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value, managerId: e.target.value === "employee" ? roleForm.managerId : "" })}
              className={inputCls}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {roleForm.role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager <span className="text-red-500">*</span></label>
              <select
                value={roleForm.managerId}
                onChange={(e) => setRoleForm({ ...roleForm, managerId: e.target.value })}
                className={inputCls}
                required
              >
                <option value="">Select a manager</option>
                {users.filter(u => u.role === "manager" && u.isActive !== false).map(m => (
                  <option key={m._id} value={m._id}>{m.username}</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => { setInviteModalOpen(false); setCreatedInviteLink(null); }}
        title={createdInviteLink ? "Invite Created" : "Invite User"}
        footer={
          createdInviteLink ? (
            <Button
              variant="outline"
              type="button"
              fullWidth
              onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); setInviteForm({ email: "", role: "employee", managerId: "" }); }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="admin-invite-user-form"
                loading={inviteSubmitting}
                loadingText="Creating"
              >
                Create Invite
              </Button>
            </>
          )
        }
      >
        {createdInviteLink ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Invite created. Share this link with the user:</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={createdInviteLink}
                className="flex-1 h-12 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800"
              />
              <button
                type="button"
                onClick={copyInviteLink}
                className="shrink-0 px-4 min-h-12 bg-[#EFF6FF] text-[#1B3F8B] rounded-xl hover:bg-blue-100 inline-flex items-center gap-2 text-sm font-semibold"
              >
                <Copy size={16} /> Copy
              </button>
            </div>
          </div>
        ) : (
          <form id="admin-invite-user-form" onSubmit={handleInviteSubmit} className="space-y-4">
            <Input
              id="admin-invite-email"
              label="Email"
              type="email"
              required
              placeholder="Enter email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              autoFocus
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className={inputCls}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {inviteForm.role === "employee" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager <span className="text-red-500">*</span></label>
                <select
                  value={inviteForm.managerId}
                  onChange={(e) => setInviteForm({ ...inviteForm, managerId: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">Select a manager</option>
                  {users.filter(u => u.role === "manager").map(m => (
                    <option key={m._id} value={m._id}>{m.username}</option>
                  ))}
                </select>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Password Reset Confirm Modal */}
      <Modal
        isOpen={!!pwdResetConfirmUser}
        onClose={() => setPwdResetConfirmUser(null)}
        title="Generate Password Reset Link"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setPwdResetConfirmUser(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={pwdResetLoading}
              loadingText="Generating"
              onClick={confirmAdminPwdReset}
            >
              Generate Link
            </Button>
          </>
        }
      >
        {pwdResetConfirmUser && (
          <p className="text-sm text-gray-600">
            Generate a reset link for{" "}
            <span className="font-semibold">{pwdResetConfirmUser.username}</span> ({pwdResetConfirmUser.email})?
          </p>
        )}
      </Modal>

      {/* Password Reset Result Modal */}
      <Modal
        isOpen={!!pwdResetResult}
        onClose={() => setPwdResetResult(null)}
        title="Password Reset Link"
        size="lg"
        footer={
          <Button variant="outline" type="button" fullWidth onClick={() => setPwdResetResult(null)}>
            Close
          </Button>
        }
      >
        {pwdResetResult && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share this link with the user via WhatsApp or any messenger.{" "}
              <span className="font-medium text-gray-800">Link expires in 1 hour</span> (or per server setting).
            </p>
            {pwdResetResult.userEmail && (
              <p className="text-xs text-gray-500">For: {pwdResetResult.userEmail}</p>
            )}
            {pwdResetResult.expiresAt && (
              <p className="text-xs text-gray-500">
                Expires: {new Date(pwdResetResult.expiresAt).toLocaleString()}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={pwdResetResult.resetLink || ""}
                className="flex-1 h-12 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-xs text-gray-800"
              />
              <div className="flex gap-2 shrink-0">
                <Button type="button" size="md" onClick={copyPwdResetLink} leftIcon={Copy}>
                  Copy Link
                </Button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="px-3 min-h-11 border border-gray-200 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add User"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="admin-add-user-form"
              loading={submitting}
              loadingText="Creating"
            >
              Create User
            </Button>
          </>
        }
      >
        <form id="admin-add-user-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="admin-add-username"
            label="Username"
            type="text"
            required
            placeholder="Enter username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoFocus
          />
          <Input
            id="admin-add-email"
            label="Email"
            type="email"
            required
            placeholder="Enter email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            id="admin-add-password"
            label="Password"
            type="password"
            required
            placeholder="Min 8 chars, uppercase, lowercase, number, special"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, managerId: e.target.value === "employee" ? form.managerId : "" })}
              className={inputCls}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager <span className="text-red-500">*</span></label>
              <select
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                className={inputCls}
                required
              >
                <option value="">Select a manager</option>
                {users.filter(u => u.role === "manager").map(m => (
                  <option key={m._id} value={m._id}>{m.username}</option>
                ))}
              </select>
              {users.filter(u => u.role === "manager").length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Create a manager first.</p>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default AdminUserManagement;
