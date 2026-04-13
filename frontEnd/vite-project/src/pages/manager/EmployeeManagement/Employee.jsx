import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Pagination, SkeletonTable, EmptyState, ErrorState } from "@/components/ui";
import {
    Pencil, Trash2, X, Search, Users,
    UserCheck, ShieldCheck, Clock, ChevronRight,
    Mail, Calendar, AlertTriangle, Eye, ArrowLeft,
    UserPlus, Copy,
} from "lucide-react";
import EmployeeTable from "./EmployeeTable";

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

const fmtTime = (iso) =>
    iso
        ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
        : "—";

/* ─── Field component (reused in modals) ─────────────────── */
const Field = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        {children}
    </div>
);

const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm";

/* ─── Stat Card ──────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{value}</p>
        </div>
    </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const Employee = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [fetchError, setFetchError] = useState(false);

    /* modals */
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    /* form */
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [addForm, setAddForm] = useState({ username: "", email: "", password: "" });
    const [inviteEmail, setInviteEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [inviteSubmitting, setInviteSubmitting] = useState(false);

    /* ── Fetch ── */
    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        setFetchError(false);
        try {
            const params = new URLSearchParams();
            params.set("page", String(currentPage));
            params.set("limit", "20");
            if (debouncedSearch) params.set("search", debouncedSearch);
            const res = await API.get(`/api/manager/shifts/employees?${params}`);
            const { data, pagination } = res.data;
            setEmployees(Array.isArray(data) ? data : []);
            setTotalPages(pagination?.totalPages ?? 1);
            setTotalItems(pagination?.total ?? 0);
        } catch {
            setFetchError(true);
            setEmployees([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    /* ── Fetch attendance for drawer ── */
    const openDrawer = useCallback(async (emp) => {
        setViewTarget(emp);
        setAttendanceHistory([]);
        setAttendanceLoading(true);
        try {
            const res = await API.get(
                `/api/manager/shifts/employees/${emp._id}/attendance`
            );
            const data = res.data.data;
            setAttendanceHistory(Array.isArray(data) ? data : data?.attendanceHistory || []);
        } catch {
            setAttendanceHistory([]);
        } finally {
            setAttendanceLoading(false);
        }
    }, []);

    /* ── Edit ── */
    const openEdit = useCallback((emp) => {
        setEditTarget(emp);
        setForm({ username: emp.username, email: emp.email, password: "" });
    }, []);

    const requestDeleteEmployee = useCallback((emp) => {
        setDeleteTarget(emp);
    }, []);

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.post("/api/manager/shifts/employees", addForm);
            toast.success("Employee created successfully");
            setAddModalOpen(false);
            setAddForm({ username: "", email: "", password: "" });
            fetchEmployees();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to add employee"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleInviteEmployee = async (e) => {
        e.preventDefault();
        setInviteSubmitting(true);
        setInviteLink(null);
        try {
            const res = await API.post("/api/invites", { email: inviteEmail, role: "employee" });
            const link = res.data?.data?.inviteLink;
            setInviteLink(link);
            toast.success("Invite created");
            if (link) navigator.clipboard?.writeText(link).then(() => toast.success("Invite link copied"));
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to create invite"));
        } finally {
            setInviteSubmitting(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.put(
                `/api/manager/shifts/employees/${editTarget._id}`,
                { username: form.username, email: form.email }
            );
            toast.success("Employee updated successfully");
            setEditTarget(null);
            setForm({ username: "", email: "", password: "" });
            fetchEmployees();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to update employee"));
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setSubmitting(true);
        try {
            await API.delete(
                `/api/manager/shifts/employees/${deleteTarget._id}`
            );
            toast.success("Employee deactivated successfully");
            setDeleteTarget(null);
            fetchEmployees();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to delete employee"));
        } finally {
            setSubmitting(false);
        }
    };

    /* ── ESC to close modals ── */
    useEffect(() => {
        const h = (e) => {
            if (e.key !== "Escape") return;
            if (editTarget) setEditTarget(null);
            if (deleteTarget) setDeleteTarget(null);
            if (viewTarget) setViewTarget(null);
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [editTarget, deleteTarget, viewTarget]);

    /* ─────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#f1f5f9] p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Page header ────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage and track your team members.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setInviteModalOpen(true); setInviteLink(null); setInviteEmail(""); }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-300 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition text-sm shrink-0"
                        >
                            <Mail className="w-4 h-4" /> Invite Employee
                        </button>
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#162d5e] text-white font-semibold rounded-xl hover:shadow-md transition text-sm shrink-0"
                        >
                            <UserPlus className="w-4 h-4" /> Add Employee
                        </button>
                    </div>
                </div>

                {/* ── Stats ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard icon={Users} label="Total Employees" value={totalItems} color="bg-gradient-to-br from-blue-600 to-[#162d5e]" />
                    <StatCard icon={UserCheck} label="Active" value={employees.filter((e) => e.isActive !== false).length} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
                </div>

                {/* ── Table card ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* toolbar */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-slate-900">
                            All Employees
                            <span className="ml-2 text-xs font-medium text-slate-400">({totalItems})</span>
                        </h2>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    {/* table body */}
                    {loading ? (
                        <div className="p-6">
                            <SkeletonTable rows={8} cols={5} />
                        </div>
                    ) : fetchError ? (
                        <div className="p-6">
                            <ErrorState
                                title="Failed to load employees"
                                message="Could not fetch employee list."
                                onRetry={fetchEmployees}
                            />
                        </div>
                    ) : (
                        <>
                            {employees.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="No employees found"
                                    message="No employees match your search."
                                    action={{
                                        label: "Add Employee",
                                        onClick: () => setAddModalOpen(true),
                                    }}
                                />
                            ) : (
                                <EmployeeTable
                                    employees={employees}
                                    onEdit={openEdit}
                                    onDelete={requestDeleteEmployee}
                                    onView={openDrawer}
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
            {/* ADD EMPLOYEE MODAL                                 */}
            {/* ══════════════════════════════════════════════════ */}
            {/* ══════════════════════════════════════════════════ */}
            {/* INVITE EMPLOYEE MODAL                              */}
            {/* ══════════════════════════════════════════════════ */}
            {inviteModalOpen && (
                <Modal title="Invite Employee" onClose={() => { setInviteModalOpen(false); setInviteLink(null); setInviteEmail(""); }}>
                    {inviteLink ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">Invite created. Share this link with the employee:</p>
                            <div className="flex gap-2">
                                <input type="text" readOnly value={inviteLink} className={`${inputCls} flex-1 bg-slate-50`} />
                                <button type="button" onClick={() => { navigator.clipboard?.writeText(inviteLink); toast.success("Copied"); }}
                                    className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 flex items-center gap-2 shrink-0">
                                    <Copy size={16} /> Copy
                                </button>
                            </div>
                            <button type="button" onClick={() => { setInviteModalOpen(false); setInviteLink(null); setInviteEmail(""); }}
                                className="w-full py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Close</button>
                        </div>
                    ) : (
                        <form onSubmit={handleInviteEmployee} className="space-y-4">
                            <Field label="Email Address">
                                <input type="email" required placeholder="Enter employee email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className={inputCls} />
                            </Field>
                            <ModalFooter
                                onCancel={() => { setInviteModalOpen(false); setInviteLink(null); setInviteEmail(""); }}
                                submitLabel="Create Invite"
                                loading={inviteSubmitting}
                            />
                        </form>
                    )}
                </Modal>
            )}

            {addModalOpen && (
                <Modal title="Add New Employee" onClose={() => { setAddModalOpen(false); setAddForm({ username: "", email: "", password: "" }); }}>
                    <form onSubmit={handleAddEmployee} className="space-y-4">
                        <Field label="Username">
                            <input type="text" required placeholder="Enter username"
                                value={addForm.username}
                                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                                className={inputCls} />
                        </Field>
                        <Field label="Email Address">
                            <input type="email" required placeholder="Enter email"
                                value={addForm.email}
                                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                className={inputCls} />
                        </Field>
                        <Field label="Password">
                            <input type="password" required placeholder="Min 8 chars, uppercase, lowercase, number, special"
                                value={addForm.password}
                                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                className={inputCls}
                                minLength={8} />
                        </Field>
                        <ModalFooter
                            onCancel={() => { setAddModalOpen(false); setAddForm({ username: "", email: "", password: "" }); }}
                            submitLabel="Create Employee"
                            loading={submitting}
                        />
                    </form>
                </Modal>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* EDIT MODAL                                         */}
            {/* ══════════════════════════════════════════════════ */}
            {editTarget && (
                <Modal title="Edit Employee" onClose={() => setEditTarget(null)}>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <Field label="Username">
                            <input type="text" required placeholder="Enter username"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className={inputCls} />
                        </Field>
                        <Field label="Email Address">
                            <input type="email" required placeholder="Enter email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className={inputCls} />
                        </Field>
                        <ModalFooter
                            onCancel={() => setEditTarget(null)}
                            submitLabel="Save Changes"
                            loading={submitting}
                        />
                    </form>
                </Modal>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* DELETE CONFIRMATION MODAL                          */}
            {/* ══════════════════════════════════════════════════ */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-7 w-7 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Deactivate Employee?</h3>
                            <p className="text-sm text-slate-500 mt-2 mb-6">
                                Are you sure you want to deactivate{" "}
                                <span className="font-semibold text-slate-800">{deleteTarget.username}</span>?
                                They will no longer be able to log in.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition text-sm disabled:opacity-60"
                                >
                                    {submitting ? "Deactivating…" : "Yes, Deactivate"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* EMPLOYEE DETAIL DRAWER                             */}
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
                        {/* Drawer header — uses auth gradient */}
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

                        {/* Info pills */}
                        <div className="-mt-5 mx-6 grid grid-cols-2 gap-3">
                            <InfoPill icon={ShieldCheck} label="Role" value="Employee" />
                            <InfoPill icon={Calendar} label="Joined" value={fmtDate(viewTarget.createdAt)} />
                        </div>

                        {/* Attendance history */}
                        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                                Attendance History
                            </p>

                            {attendanceLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                                </div>
                            ) : attendanceHistory.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-slate-400">
                                    <Clock className="h-10 w-10 mb-2 opacity-30" />
                                    <p className="text-sm">No attendance records yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {attendanceHistory.map((rec, i) => (
                                        <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-semibold text-slate-800 truncate pr-2">
                                                    {rec.shiftTitle || "Shift"}
                                                </p>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                                                    {rec.totalHours != null ? `${rec.totalHours}h` : "—"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                <div>
                                                    <p className="text-slate-400 mb-0.5">Check In</p>
                                                    <p className="font-medium text-slate-700">{fmtDate(rec.checkIn)} {fmtTime(rec.checkIn)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 mb-0.5">Check Out</p>
                                                    <p className="font-medium text-slate-700">{fmtDate(rec.checkOut)} {fmtTime(rec.checkOut)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Drawer footer actions */}
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => { setViewTarget(null); openEdit(viewTarget); }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-[#162d5e] text-white font-semibold rounded-xl text-sm hover:shadow-md transition"
                            >
                                <Pencil className="h-4 w-4" /> Edit Employee
                            </button>
                            <button
                                onClick={() => { setViewTarget(null); setDeleteTarget(viewTarget); }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Reusable Modal wrapper ─────────────────────────────── */
const Modal = ({ title, onClose, children }) => (
    <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
        <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Modal gradient header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#162d5e] px-6 py-5 rounded-t-2xl flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition text-white">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

/* ─── Modal footer buttons ───────────────────────────────── */
const ModalFooter = ({ onCancel, submitLabel, loading }) => (
    <div className="flex justify-end gap-3 pt-2">
        <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
        >
            Cancel
        </button>
        <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-[#162d5e] text-white font-semibold rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-sm disabled:opacity-60"
        >
            {loading ? "Saving…" : submitLabel}
        </button>
    </div>
);

/* ─── Info pill (used in drawer) ─────────────────────────── */
const InfoPill = ({ icon: Icon, label, value }) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
        </div>
    </div>
);

export default Employee;
