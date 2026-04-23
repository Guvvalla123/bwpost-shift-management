import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import API from "@/api";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "sonner";
import { Pagination, SkeletonTable, SkeletonList, EmptyState, ErrorState, Modal, Input, Button } from "@/components/ui";
import {
  UserPlus, Search, Briefcase, Mail, Copy,
  UserCheck, ArrowLeft, Calendar, ShieldCheck,
} from "lucide-react";
import ManagerTable from "./ManagerManagement/ManagerTable";

/* ─── Helpers ────────────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  "from-blue-600 to-[#162d5e]",
  "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];
const avatarGradient = (name = "") =>
  AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";

/* ─── Field component (reused in modals) ─────────────────── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    {children}
  </div>
);

const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base md:text-sm";

/* ─── Stat Card ──────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
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

const AdminManagerManagement = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ role: "manager" });
      params.set("page", String(currentPage));
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (includeInactive) params.set("includeInactive", "true");
      const res = await API.get(`/api/admin/users?${params}`);
      const { data, pagination } = res.data;
      setManagers(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(pagination?.total ?? 0);
    } catch {
      setFetchError(true);
      setManagers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, includeInactive]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const fetchManagersSilent = useCallback(async () => {
    try {
      const params = new URLSearchParams({ role: "manager" });
      params.set("page", String(currentPage));
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (includeInactive) params.set("includeInactive", "true");
      const res = await API.get(`/api/admin/users?${params}`);
      const { data, pagination } = res.data;
      setManagers(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(pagination?.total ?? 0);
    } catch {
      /* silent — keep previous data */
    }
  }, [currentPage, debouncedSearch, includeInactive]);

  useAutoRefresh(fetchManagersSilent, 60_000);

  const filtered = managers;

  const handleViewManager = useCallback((m) => {
    setViewTarget(m);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/api/admin/users", { ...form, role: "manager" });
      toast.success("Manager created successfully");
      setModalOpen(false);
      setForm({ username: "", email: "", password: "" });
      fetchManagers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create manager"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteSubmitting(true);
    setCreatedInviteLink(null);
    try {
      const res = await API.post("/api/invites", { email: inviteEmail, role: "manager" });
      const link = res.data?.data?.inviteLink;
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
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key !== "Escape") return;
      if (viewTarget) setViewTarget(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [viewTarget]);

  const activeCount = managers.filter((m) => m.isActive !== false).length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Page header ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and invite system managers</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setInviteModalOpen(true); setCreatedInviteLink(null); setInviteEmail(""); }}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 bg-white border border-blue-300 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-1 text-sm"
            >
              <Mail className="w-4 h-4" /> Invite Manager
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 bg-[#1B3F8B] text-white font-semibold rounded-xl hover:bg-[#162d5e] transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1 text-sm"
            >
              <UserPlus className="w-4 h-4" /> Add Manager
            </button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Briefcase} label="Total Managers" value={totalItems} color="bg-gradient-to-br from-blue-600 to-[#162d5e]" />
          <StatCard icon={UserCheck} label="Active" value={activeCount} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        </div>

        {/* ── Table card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              All Managers
              <span className="ml-2 text-xs font-medium text-gray-400">({totalItems})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer shrink-0">
                <input type="checkbox" checked={includeInactive} onChange={(e) => { setIncludeInactive(e.target.checked); setCurrentPage(1); }} className="rounded" />
                Include deactivated
              </label>
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <SkeletonTable rows={6} cols={4} />
              </div>
              <div className="md:hidden">
                <SkeletonList count={5} />
              </div>
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load managers"
                description="Could not fetch manager list. Please try again."
                onRetry={fetchManagers}
              />
            </div>
          ) : (
            <>
              {managers.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No managers yet"
                  description="Invite your first manager to get started."
                  actionLabel="Invite Manager"
                  onAction={() => { setInviteModalOpen(true); setCreatedInviteLink(null); setInviteEmail(""); }}
                />
              ) : (
                <ManagerTable
                  managers={filtered}
                  onView={handleViewManager}
                />
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

      {/* ══════════════════════════════════════════════════ */}
      {/* INVITE MANAGER MODAL                              */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => { setInviteModalOpen(false); setCreatedInviteLink(null); setInviteEmail(""); }}
        title={createdInviteLink ? "Invite Created" : "Invite Manager"}
        footer={
          createdInviteLink ? (
            <Button
              variant="outline"
              type="button"
              fullWidth
              onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); setInviteEmail(""); }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={() => { setInviteModalOpen(false); setCreatedInviteLink(null); setInviteEmail(""); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="mgr-invite-form"
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
            <p className="text-sm text-gray-600">Invite created. Share this link with the manager:</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={createdInviteLink}
                className="flex-1 h-12 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800"
              />
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText(createdInviteLink); toast.success("Copied"); }}
                className="shrink-0 px-4 min-h-12 bg-[#EFF6FF] text-[#1B3F8B] rounded-xl hover:bg-blue-100 inline-flex items-center gap-2 text-sm font-semibold"
              >
                <Copy size={16} /> Copy
              </button>
            </div>
          </div>
        ) : (
          <form id="mgr-invite-form" onSubmit={handleInviteSubmit} className="space-y-4">
            <Input
              id="mgr-invite-email"
              label="Email Address"
              type="email"
              required
              placeholder="Enter manager email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
            />
          </form>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ADD MANAGER MODAL                                 */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm({ username: "", email: "", password: "" }); }}
        title="Add New Manager"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => { setModalOpen(false); setForm({ username: "", email: "", password: "" }); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="mgr-add-form"
              loading={submitting}
              loadingText="Creating"
            >
              Create Manager
            </Button>
          </>
        }
      >
        <form id="mgr-add-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="mgr-add-username"
            label="Username"
            type="text"
            required
            placeholder="Enter username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoFocus
          />
          <Input
            id="mgr-add-email"
            label="Email Address"
            type="email"
            required
            placeholder="Enter email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            id="mgr-add-password"
            label="Password"
            type="password"
            required
            placeholder="Min 8 chars, uppercase, lowercase, number, special"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
          />
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════ */}
      {/* MANAGER DETAIL DRAWER                             */}
      {/* ══════════════════════════════════════════════════ */}
      {viewTarget && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setViewTarget(null)}
        >
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#162d5e] px-6 pt-8 pb-10">
              <button
                onClick={() => setViewTarget(null)}
                className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm mb-6 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(viewTarget.username)} flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white/20`}>
                  {initials(viewTarget.username)}
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{viewTarget.username}</p>
                  <p className="text-blue-200 text-sm mt-0.5">{viewTarget.email}</p>
                </div>
              </div>
            </div>

            <div className="-mt-5 mx-6 grid grid-cols-2 gap-3">
              <InfoPill icon={ShieldCheck} label="Role" value="Manager" />
              <InfoPill icon={Calendar} label="Joined" value={fmtDate(viewTarget.createdAt)} />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Overview
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-600">
                  Managers handle day-to-day operations including shift assignments, request approvals, and employee management.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const InfoPill = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-blue-600" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  </div>
);

export default AdminManagerManagement;
