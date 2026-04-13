import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { UserPlus, Search, X, Shield, Users, UserCheck, Mail, Copy, Pencil } from "lucide-react";
import { Pagination, SkeletonTable, EmptyState, ErrorState } from "@/components/ui";

const ROLE_BADGES = {
  admin: "bg-amber-100 text-amber-700 border-amber-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  employee: "bg-emerald-100 text-emerald-700 border-emerald-200",
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
  const debouncedSearch = useDebounce(search, 300);

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

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm";

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 text-sm mt-1">Create and manage Admin, Manager, and Employee accounts.</p>
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

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <div className="relative flex-1 w-full sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 min-h-11 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto sm:min-w-[140px] px-4 py-2 min-h-11 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer min-h-11 w-full sm:w-auto">
              <input type="checkbox" checked={includeInactive} onChange={(e) => { setIncludeInactive(e.target.checked); setCurrentPage(1); }} className="rounded w-4 h-4 shrink-0" />
              Include deactivated
            </label>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={8} cols={5} />
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load users"
                message="Could not fetch user list. Please try again."
                onRetry={fetchUsers}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                {users.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    message="No users match your current filters."
                  />
                ) : (
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
                            {u.isActive !== false && (
                              <button
                                onClick={() => { setRoleModalUser(u); setRoleForm({ role: u.role, managerId: u.managerId?._id || u.managerId || "" }); }}
                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Change role"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRoleModalUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 rounded-t-2xl flex items-center justify-between">
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
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRoleModalUser(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={roleSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md disabled:opacity-60">
                  {roleSubmitting ? "Updating…" : "Update Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 rounded-t-2xl flex items-center justify-between">
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
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); }}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={inviteSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md disabled:opacity-60">
                    {inviteSubmitting ? "Creating…" : "Create Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 rounded-t-2xl flex items-center justify-between">
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
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md disabled:opacity-60">
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
