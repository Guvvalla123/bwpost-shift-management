import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage, unwrapSuccessData } from "@/utils/apiError";
import { UserPlus, Search, X, Shield, Users, UserCheck, Mail, Copy, Pencil, Key, Loader2 } from "lucide-react";
import { Pagination, SkeletonTable, SkeletonList, EmptyState, ErrorState, KpiCard } from "@/components/ui";

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
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
      setFetchError(true);
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, roleFilter, includeInactive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  const inputCls = "w-full h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base";

  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-0 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-400 mt-1">Manage all system users</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
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
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      roleFilter === key ? "bg-white/20 text-white" : "bg-white text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:ml-auto sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-600 sm:ml-0">
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
                {users.map((u) => (
                  <div key={u._id} className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${u.isActive === false ? "opacity-70" : ""}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full flex-shrink-0 bg-[#1B3F8B] flex items-center justify-center text-white font-bold text-sm">
                        {u.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{u.username}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 border ${ROLE_BADGES[u.role] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.isActive !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                      }`}>
                        {u.isActive !== false ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-DE") : "—"}
                      </span>
                    </div>
                    {(u.role !== "admin" || u.isActive !== false) && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            title="Generate Reset Link"
                            onClick={() => setPwdResetConfirmUser(u)}
                            className="flex-1 min-h-11 text-sm font-medium rounded-lg border border-[#1B3F8B]/30 text-[#1B3F8B] bg-[#EFF6FF] hover:bg-blue-100 inline-flex items-center justify-center gap-1"
                          >
                            <Key size={14} />
                            Reset link
                          </button>
                        )}
                        {u.isActive !== false && (
                          <button
                            type="button"
                            onClick={() => { setRoleModalUser(u); setRoleForm({ role: u.role, managerId: u.managerId?._id || u.managerId || "" }); }}
                            className="flex-1 min-h-11 text-sm font-medium rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 inline-flex items-center justify-center gap-1"
                          >
                            <Pencil size={14} />
                            Change role
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u) => (
                        <tr key={u._id} className={`hover:bg-slate-50/50 ${u.isActive === false ? "opacity-60" : ""}`}>
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900">{u.username}</p>
                            {u.isActive === false && <span className="text-xs text-amber-600">Deactivated</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGES[u.role] || "bg-slate-100 text-slate-600"}`}>
                              {u.role === "admin" && <Shield size={12} />}
                              {u.role === "manager" && <Users size={12} />}
                              {u.role === "employee" && <UserCheck size={12} />}
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {u.role !== "admin" && (
                                <button
                                  type="button"
                                  onClick={() => setPwdResetConfirmUser(u)}
                                  className="p-2 text-slate-500 hover:text-[#1B3F8B] hover:bg-[#EFF6FF] rounded-lg transition"
                                  title="Generate Reset Link"
                                >
                                  <Key size={16} />
                                </button>
                              )}
                              {u.isActive !== false && (
                                <button
                                  type="button"
                                  onClick={() => { setRoleModalUser(u); setRoleForm({ role: u.role, managerId: u.managerId?._id || u.managerId || "" }); }}
                                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
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
      {roleModalUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4" onClick={() => setRoleModalUser(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto md:mx-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" aria-hidden />
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 rounded-t-2xl md:rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Change Role</h2>
              <button onClick={() => setRoleModalUser(null)} className="p-1.5 rounded-lg hover:bg-white/20 text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleRoleChange} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Updating role for <strong>{roleModalUser.username}</strong> ({roleModalUser.email})</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
                <select value={roleForm.role} onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value, managerId: e.target.value === "employee" ? roleForm.managerId : "" })}
                  className={inputCls}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {roleForm.role === "employee" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager <span className="text-red-500">*</span></label>
                  <select value={roleForm.managerId} onChange={(e) => setRoleForm({ ...roleForm, managerId: e.target.value })}
                    className={inputCls} required>
                    <option value="">Select a manager</option>
                    {users.filter(u => u.role === "manager" && u.isActive !== false).map(m => (
                      <option key={m._id} value={m._id}>{m.username}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setRoleModalUser(null)}
                  className="w-full sm:w-auto px-5 py-3 min-h-12 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={roleSubmitting}
                  className="w-full sm:w-auto px-5 py-3 min-h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md disabled:opacity-60">
                  {roleSubmitting ? "Updating…" : "Update Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4" onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); }}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto md:mx-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" aria-hidden />
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 rounded-t-2xl md:rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Invite User</h2>
              <button onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); }} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
                <X size={18} />
              </button>
            </div>
            {createdInviteLink ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Invite created. Share this link with the user:</p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={createdInviteLink} className={`${inputCls} flex-1 bg-slate-50`} />
                  <button type="button" onClick={copyInviteLink} className="px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 flex items-center gap-2">
                    <Copy size={16} /> Copy
                  </button>
                </div>
                <button type="button" onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); setInviteForm({ email: "", role: "employee", managerId: "" }); }}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Close</button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" required placeholder="Enter email" value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className={inputCls}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {inviteForm.role === "employee" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager <span className="text-red-500">*</span></label>
                    <select value={inviteForm.managerId} onChange={(e) => setInviteForm({ ...inviteForm, managerId: e.target.value })}
                      className={inputCls} required>
                      <option value="">Select a manager</option>
                      {users.filter(u => u.role === "manager").map(m => (
                        <option key={m._id} value={m._id}>{m.username}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); }}
                    className="w-full sm:w-auto px-5 py-3 min-h-12 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={inviteSubmitting}
                    className="w-full sm:w-auto px-5 py-3 min-h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md disabled:opacity-60">
                    {inviteSubmitting ? "Creating…" : "Create Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {pwdResetConfirmUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4"
          onClick={() => setPwdResetConfirmUser(null)}
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md p-6 md:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Generate Password Reset Link</h2>
            <p className="text-sm text-slate-600 mt-2">
              Generate a reset link for{" "}
              <span className="font-semibold">{pwdResetConfirmUser.username}</span> ({pwdResetConfirmUser.email})?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPwdResetConfirmUser(null)}
                className="w-full sm:w-auto flex-1 py-3 min-h-12 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pwdResetLoading}
                onClick={confirmAdminPwdReset}
                className="w-full sm:w-auto flex-1 py-3 min-h-12 bg-[#1B3F8B] text-white font-semibold rounded-xl hover:bg-[#152f6b] inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {pwdResetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generate Link
              </button>
            </div>
          </div>
        </div>
      )}

      {pwdResetResult && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4"
          onClick={() => setPwdResetResult(null)}
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg p-6 md:mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Password Reset Link</h2>
            <p className="text-sm text-slate-600 mt-1">
              Share this link with the user via WhatsApp or any messenger.{" "}
              <span className="font-medium text-slate-800">Link expires in 1 hour</span> (or per server setting).
            </p>
            {pwdResetResult.userEmail ? (
              <p className="text-xs text-slate-500 mt-2">For: {pwdResetResult.userEmail}</p>
            ) : null}
            {pwdResetResult.expiresAt ? (
              <p className="text-xs text-slate-500 mt-1">
                Expires: {new Date(pwdResetResult.expiresAt).toLocaleString()}
              </p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <input
                type="text"
                readOnly
                value={pwdResetResult.resetLink || ""}
                className={`${inputCls} flex-1 bg-slate-50 text-xs`}
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyPwdResetLink}
                  className="px-4 py-2.5 min-h-11 bg-[#1B3F8B] text-white rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#152f6b]"
                >
                  <Copy size={16} />
                  Copy Link
                </button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="px-3 py-2.5 min-h-11 border border-slate-200 text-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  WhatsApp
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPwdResetResult(null)}
              className="w-full mt-4 py-2.5 bg-slate-100 text-slate-800 font-medium rounded-xl hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto md:mx-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" aria-hidden />
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 rounded-t-2xl md:rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add User</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input type="text" required placeholder="Enter username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" required placeholder="Enter email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" required placeholder="Min 8 chars, uppercase, lowercase, number, special"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls} minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, managerId: e.target.value === "employee" ? form.managerId : "" })}
                  className={inputCls}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === "employee" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager <span className="text-red-500">*</span></label>
                  <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className={inputCls} required>
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
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-3 min-h-12 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="w-full sm:w-auto px-5 py-3 min-h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md disabled:opacity-60">
                  {submitting ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
