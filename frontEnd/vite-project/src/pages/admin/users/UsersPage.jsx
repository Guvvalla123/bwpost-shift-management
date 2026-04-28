// UsersPage.jsx
// This is the main user management page for the admin panel.
// Admin can see all users, create new ones, invite via link,
// change roles, and generate password reset links.
//
// THIS FILE ONLY MANAGES STATE AND DATA LOADING.
// The actual UI pieces are in separate component files:
// - UserStats.jsx      shows the 3 stat cards at the top
// - UserCard.jsx       shows one user as a card on mobile
// - CreateUserModal.jsx  form to create a user directly
// - InviteUserModal.jsx  creates a self-registration invite link
// - ChangeRoleModal.jsx  changes a user's role
// - ResetPasswordModal.jsx  generates a password reset link

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  Pagination,
  SkeletonTable,
  SkeletonList,
  EmptyState,
  ErrorState,
  Badge,
} from "@/components/ui";
import {
  UserPlus, Search, X, Shield, Users, UserCheck, Mail, Pencil, Key,
} from "lucide-react";

// Import all API functions from the dedicated API module
import {
  getAllUsers,
  getUserStats,
  updateUserRole,
  generateResetLink,
  getAllManagers,
} from "./usersApi";

// Import all sub-components — each handles one piece of the UI
import UserStats        from "./UserStats";
import UserCard         from "./UserCard";
import CreateUserModal  from "./CreateUserModal";
import InviteUserModal  from "./InviteUserModal";
import ChangeRoleModal  from "./ChangeRoleModal";
import ResetPasswordModal from "./ResetPasswordModal";

// ROLE_BADGES - CSS classes for role badge colors used in the desktop table
const ROLE_BADGES = {
  admin:    "bg-purple-50 text-purple-700 border border-purple-200",
  manager:  "bg-[#EFF6FF] text-[#1B3F8B] border border-blue-100",
  employee: "bg-emerald-50 text-emerald-800 border border-emerald-100",
};

// ── Main Page Component ────────────────────────────────────────
const UsersPage = () => {
  // ── User list state ────────────────────────────────────────

  // List of users loaded from the server
  const [users, setUsers] = useState([]);

  // True while loading users from the server
  const [loading, setLoading] = useState(true);

  // True if the last load request failed
  const [fetchError, setFetchError] = useState(false);

  // Total user count returned by server (used by pagination)
  const [totalItems, setTotalItems] = useState(0);

  // Total pages for pagination
  const [totalPages, setTotalPages] = useState(1);

  // Current page number — changes when admin clicks pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Text typed in the search box
  const [search, setSearch] = useState("");

  // Debounced version of search — API only called after 300ms pause
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Currently selected role filter pill
  // "" = All, "admin", "manager", or "employee"
  const [roleFilter, setRoleFilter] = useState("");

  // True when the "Include deactivated" checkbox is checked
  // Includes inactive/disabled accounts in the list
  const [includeInactive, setIncludeInactive] = useState(false);

  // ── Stats state ────────────────────────────────────────────

  // User count statistics for the KPI cards at the top
  // totalAll, active, inactive, admin, manager, employee
  const [stats, setStats] = useState({
    totalAll: 0,
    active:   0,
    inactive: 0,
    admin:    0,
    manager:  0,
    employee: 0,
  });

  // ── Managers list state ────────────────────────────────────

  // Full list of all active managers
  // Used to populate the manager dropdown in Create/Invite/ChangeRole modals
  // Loaded once on page open — separate from the main user list
  const [managers, setManagers] = useState([]);

  // ── Modal open/close state ─────────────────────────────────

  // True when the Create User modal is visible
  const [showCreateModal, setShowCreateModal] = useState(false);

  // True when the Invite User modal is visible
  const [showInviteModal, setShowInviteModal] = useState(false);

  // The user whose role is being changed — opens ChangeRoleModal when set
  // When null, the role change modal is hidden
  const [userForRoleChange, setUserForRoleChange] = useState(null);

  // True while the role change API call is running
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // ── Password reset state ───────────────────────────────────

  // The user who needs a password reset — opens ResetPasswordModal when set
  // When null, the modal is hidden
  const [userForReset, setUserForReset] = useState(null);

  // The generated reset link URL string
  // Empty = no link yet (show confirm screen)
  // Non-empty = link is ready (show copy screen)
  const [resetLink, setResetLink] = useState("");

  // Full reset response data — may include userEmail and expiresAt
  const [resetData, setResetData] = useState(null);

  // True while the generate reset link API call is running
  const [isGeneratingReset, setIsGeneratingReset] = useState(false);

  // ── Auto-refresh interval reference ───────────────────────
  // Stores the setInterval ID so we can clear it on unmount
  const refreshTimerRef = useRef(null);

  // ── Debounce: wait 300ms after typing before calling API ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load everything when page first opens ─────────────────
  useEffect(() => {
    loadUsers();
    loadStats();
    loadManagers();
  }, []);

  // ── Reload users when filters or page changes ─────────────
  useEffect(() => {
    loadUsers();
  }, [currentPage, debouncedSearch, roleFilter, includeInactive]);

  // ── Auto-refresh: silently refresh every 60 seconds ───────
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      loadUsersSilent();
      loadStats();
    }, 60_000);
    return () => clearInterval(refreshTimerRef.current);
  }, [currentPage, debouncedSearch, roleFilter, includeInactive]);

  // ── Functions ──────────────────────────────────────────────

  // loadUsers - fetches the user list showing a loading spinner
  // Called on page load and when any filter changes
  async function loadUsers() {
    setLoading(true);
    setFetchError(false);
    try {
      const result = await getAllUsers(currentPage, debouncedSearch, roleFilter, includeInactive);
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch {
      setFetchError(true);
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  // loadUsersSilent - refreshes the user list without showing a spinner
  // Used for background auto-refresh so the page doesn't flicker
  async function loadUsersSilent() {
    try {
      const result = await getAllUsers(currentPage, debouncedSearch, roleFilter, includeInactive);
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch {
      // Silent — keep showing previous data
    }
  }

  // loadStats - fetches user count statistics for the KPI cards
  async function loadStats() {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch {
      // Keep previous stats on failure
    }
  }

  // loadManagers - fetches all active managers for use in dropdowns
  // Only called once on page load — managers list rarely changes
  async function loadManagers() {
    try {
      const data = await getAllManagers();
      setManagers(data);
    } catch {
      setManagers([]);
    }
  }

  // handleCreateSuccess - called after a new user is successfully created
  // Closes the create modal and refreshes list and stats
  function handleCreateSuccess() {
    setShowCreateModal(false);
    loadUsers();
    loadStats();
    loadManagers(); // Refresh managers in case a new manager was created
  }

  // handleInviteSuccess - called after an invite link is created
  // Stats may update after a new invite is used later
  function handleInviteSuccess() {
    // No immediate list refresh needed — invite creates a pending registration
  }

  // handleChangeRole - opens the role change modal for a specific user
  // user - the user whose role should be changed
  function handleChangeRole(user) {
    setUserForRoleChange(user);
  }

  // handleConfirmRoleChange - sends the role change request to the server
  // Called when admin clicks "Update Role" in ChangeRoleModal
  // newRole   - the role string selected: "admin" | "manager" | "employee"
  // managerId - the manager ID selected (only required for employee role)
  async function handleConfirmRoleChange(newRole, managerId) {
    if (!userForRoleChange) return;
    setIsUpdatingRole(true);
    try {
      await updateUserRole(userForRoleChange._id, newRole, managerId);
      toast.success("Role updated successfully");
      setUserForRoleChange(null);
      loadUsers();
      loadStats();
      loadManagers(); // Re-fetch in case a user became/stopped being a manager
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update role"));
    } finally {
      setIsUpdatingRole(false);
    }
  }

  // handleOpenResetModal - opens the password reset modal for a user
  // Clears any previously generated link first
  // user - the user who needs a password reset
  function handleOpenResetModal(user) {
    setUserForReset(user);
    setResetLink("");
    setResetData(null);
  }

  // handleCloseResetModal - closes the password reset modal
  // Clears link and user selection
  function handleCloseResetModal() {
    setUserForReset(null);
    setResetLink("");
    setResetData(null);
  }

  // handleGenerateResetLink - calls the API to generate a reset link
  async function handleGenerateResetLink() {
    if (!userForReset) return;
    setIsGeneratingReset(true);
    try {
      const data = await generateResetLink(userForReset._id);
      setResetLink(data?.resetLink || "");
      setResetData(data);
      toast.success("Password reset link generated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate link"));
    } finally {
      setIsGeneratingReset(false);
    }
  }

  // handleSearchChange - updates the search text
  // text - the new search string typed by the admin
  function handleSearchChange(text) {
    setSearch(text);
    // currentPage reset is handled in the debounce useEffect
  }

  // handleRoleFilterChange - changes the active role filter pill
  // role - "" for All, or "admin" | "manager" | "employee"
  function handleRoleFilterChange(role) {
    setRoleFilter(role);
    setCurrentPage(1);
  }

  // handlePageChange - moves to a different page of users
  // page - the new page number to load
  function handlePageChange(page) {
    setCurrentPage(page);
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ── Page header: title + action buttons ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all system users</p>
          </div>

          {/* Invite and Add buttons */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            {/* Invite User button — generates a self-registration link */}
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 bg-white border border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition text-sm"
            >
              <Mail className="w-4 h-4" /> Invite User
            </button>

            {/* Add User button — admin creates account directly */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-md transition text-sm"
            >
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* ── KPI stat cards ── */}
        {/* UserStats shows Total / Active / Inactive counts */}
        <UserStats
          totalUsers={stats.totalAll}
          activeUsers={stats.active}
          inactiveUsers={stats.inactive}
        />

        {/* ── Main user table card ── */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Toolbar: role filter pills + search + inactive checkbox */}
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
            {/* Role filter pill buttons */}
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              {[
                { key: "",         label: "All",      count: stats.totalAll },
                { key: "admin",    label: "Admin",    count: stats.admin },
                { key: "manager",  label: "Manager",  count: stats.manager },
                { key: "employee", label: "Employee", count: stats.employee },
              ].map(({ key, label, count }) => (
                <button
                  key={key || "all"}
                  type="button"
                  onClick={() => handleRoleFilterChange(key)}
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

            {/* Search input */}
            <div className="relative w-full sm:ml-auto sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
                aria-label="Search users"
              />
              {/* Clear search button */}
              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Include deactivated checkbox */}
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

          {/* Table body: loading / error / empty / data */}
          {loading ? (
            <div className="p-6">
              {/* Skeleton table on desktop */}
              <div className="hidden md:block">
                <SkeletonTable rows={8} cols={5} />
              </div>
              {/* Skeleton list on mobile */}
              <div className="md:hidden">
                <SkeletonList count={5} />
              </div>
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load users"
                description="Could not fetch user list. Please try again."
                onRetry={loadUsers}
              />
            </div>
          ) : (
            <>
              {users.length === 0 ? (
                /* Empty state */
                <EmptyState
                  icon={Users}
                  title="No users found"
                  description="Create your first user to get started."
                  actionLabel="Add user"
                  onAction={() => setShowCreateModal(true)}
                />
              ) : (
                <>
                  {/* ── MOBILE: UserCard list (hidden on md+) ── */}
                  <div className="md:hidden space-y-3 px-4 pb-4">
                    {users.map((u) => (
                      /* UserCard shows one user on mobile with action buttons */
                      <UserCard
                        key={u._id}
                        user={u}
                        onChangeRole={handleChangeRole}
                        onResetPassword={handleOpenResetModal}
                        onDeleteUser={null}
                      />
                    ))}
                  </div>

                  {/* ── DESKTOP: Full table (hidden on mobile) ── */}
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
                          <tr
                            key={u._id}
                            className={`hover:bg-slate-50/50 transition-colors duration-100 ${
                              u.isActive === false ? "opacity-60" : ""
                            }`}
                          >
                            {/* Username + deactivated label */}
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">{u.username}</p>
                              {u.isActive === false && (
                                <span className="text-xs text-amber-600">Deactivated</span>
                              )}
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 text-gray-600">{u.email}</td>

                            {/* Role badge with icon */}
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  ROLE_BADGES[u.role] || "bg-slate-100 text-gray-600"
                                }`}
                              >
                                {u.role === "admin"    && <Shield size={12} />}
                                {u.role === "manager"  && <Users size={12} />}
                                {u.role === "employee" && <UserCheck size={12} />}
                                {u.role}
                              </span>
                            </td>

                            {/* Join date */}
                            <td className="px-6 py-4 text-gray-500 text-sm">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "—"}
                            </td>

                            {/* Action buttons */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                {/* Reset password button — hidden for admin */}
                                {u.role !== "admin" && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenResetModal(u)}
                                    className="p-2 text-gray-500 hover:text-[#1B3F8B] hover:bg-[#EFF6FF] rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                                    title="Generate Reset Link"
                                  >
                                    <Key size={16} />
                                  </button>
                                )}
                                {/* Change role button — only for active users */}
                                {u.isActive !== false && (
                                  <button
                                    type="button"
                                    onClick={() => handleChangeRole(u)}
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

              {/* Pagination — shows only when there are multiple pages */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={20}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* CREATE USER MODAL                                      */}
      {/* Opens when admin clicks "Add User" button             */}
      {/* ══════════════════════════════════════════════════════ */}
      <CreateUserModal
        isOpen={showCreateModal}
        managers={managers}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* INVITE USER MODAL                                      */}
      {/* Opens when admin clicks "Invite User" button          */}
      {/* ══════════════════════════════════════════════════════ */}
      <InviteUserModal
        isOpen={showInviteModal}
        managers={managers}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* CHANGE ROLE MODAL                                      */}
      {/* Opens when admin clicks the shield/pencil icon         */}
      {/* ══════════════════════════════════════════════════════ */}
      <ChangeRoleModal
        isOpen={!!userForRoleChange}
        user={userForRoleChange}
        managers={managers}
        isUpdating={isUpdatingRole}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setUserForRoleChange(null)}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* RESET PASSWORD MODAL                                   */}
      {/* Opens when admin clicks the key icon on a user        */}
      {/* ══════════════════════════════════════════════════════ */}
      <ResetPasswordModal
        isOpen={!!userForReset}
        user={userForReset}
        resetLink={resetLink}
        resetData={resetData}
        isGenerating={isGeneratingReset}
        onClose={handleCloseResetModal}
        onGenerate={handleGenerateResetLink}
      />
    </div>
  );
};

export default UsersPage;
