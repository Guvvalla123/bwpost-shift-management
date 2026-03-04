import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Settings, User, Bell, ChevronDown, CheckCheck, AlertTriangle, Info, CheckCircle2, Zap } from "lucide-react";
import Managersidebar from "./Managersidebar";
import { useAuth } from "@/context/AuthContext";
import API from "@/api";

/* Sharp Cloudinary avatar URL (96×96 face-crop) */
const avatarUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/w_96,h_96,c_fill,g_face,q_auto,f_auto/");
};

/* ── Route → Page title map ──────────────────────────────────────── */
const PAGE_TITLES = {
  "/manager/dashboard": "Dashboard",
  "/manager/shifts": "Shift Management",
  "/manager/employees": "Employee Management",
  "/manager/shiftrequests": "Shift Requests",
  "/manager/calender": "Calendar",
  "/manager/attendance": "Attendance & Timesheets",
  "/manager/reports": "Reports & Analytics",
  "/manager/settings": "Settings",
};

/* ── Notification type config ────────────────────────────────────── */
const notifIcon = (text = "") => {
  const t = text.toLowerCase();
  if (t.includes("staff") || t.includes("low") || t.includes("understaffed"))
    return { Icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" };
  if (t.includes("next") || t.includes("shift") || t.includes("upcoming"))
    return { Icon: Zap, color: "text-blue-500", bg: "bg-blue-50" };
  if (t.includes("complete") || t.includes("full"))
    return { Icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" };
  return { Icon: Info, color: "text-indigo-500", bg: "bg-indigo-50" };
};

/* ══════════════════════════════════════════════════════════════════
   NOTIFICATION BELL + POPOVER
══════════════════════════════════════════════════════════════════ */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifs] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const bellRef = useRef();

  /* Close on outside click */
  useEffect(() => {
    const h = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Fetch notifications from dashboard API */
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/manager/shifts/dashboard/data");
      const msgs = res.data?.notifications || [];

      // Build rich notification objects
      const built = msgs.map((msg, i) => ({
        id: `${i}-${msg}`,
        text: msg,
        time: "Just now",
      }));

      // Always add a "System" notification so panel is never empty
      if (built.length === 0) {
        built.push({
          id: "sys-ok",
          text: "All shifts are fully staffed ✓",
          time: "Now",
        });
      }

      setNotifs(built);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  /* Fetch on mount + every 60 seconds */
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const unread = notifications.filter(n => !readIds.has(n.id)).length;

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-150"
        title="Notifications"
      >
        <Bell size={16} />
        {/* Badge */}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-indigo-500" />
              <p className="text-sm font-bold text-slate-800">Notifications</p>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckCircle2 size={28} className="mb-2 opacity-40" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs mt-0.5">No new notifications</p>
              </div>
            ) : (
              notifications.map(n => {
                const { Icon, color, bg } = notifIcon(n.text);
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => setReadIds(s => new Set([...s, n.id]))}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${isRead ? "opacity-60" : ""}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={14} className={color} />
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${isRead ? "text-slate-500" : "text-slate-800 font-medium"}`}>
                        {n.text}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                    {/* Unread dot */}
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
            <p className="text-[11px] text-slate-400 text-center">
              Auto-refreshes every 60 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MANAGER LAYOUT
══════════════════════════════════════════════════════════════════ */
const ManagerLayout = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dropdownRef = useRef();
  const { user, logout } = useAuth();

  const pageTitle = PAGE_TITLES[pathname] ?? "Manager Panel";

  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try { await API.post("/api/users/logout"); } catch { }
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Managersidebar />

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Navbar ──────────────────────────────────────── */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 shadow-sm shrink-0 sticky top-0 z-30">

          {/* Page title + breadcrumb */}
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">{pageTitle}</h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Manager Panel &nbsp;/&nbsp; {pageTitle}
            </p>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">

            {/* Notification bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200" />

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 focus:outline-none group"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-blue-200 shrink-0 group-hover:ring-blue-400 transition-all duration-200">
                  {user?.profileImage
                    ? <img src={avatarUrl(user.profileImage)} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    : initials
                  }
                </div>
                {/* Name + role */}
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-sm font-semibold text-slate-800">{user?.username || "Manager"}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role || "Manager"}</p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">

                  {/* Mini profile header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{user?.username || "Manager"}</p>
                    <p className="text-xs text-slate-400">{user?.email || ""}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User size={15} className="text-slate-400" />
                      My Profile
                    </button>

                    <button
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={15} className="text-slate-400" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default ManagerLayout;
