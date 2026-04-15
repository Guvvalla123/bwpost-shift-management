import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const SHORT_PAGE_TITLES = {
  "Shift Management": "Shifts",
  "Employee Management": "Employees",
  "Attendance & Timesheets": "Attendance",
  "Shift Requests": "Requests",
  "Reports & Analytics": "Reports",
};
import { LogOut, Settings, User, Bell, ChevronDown, CheckCheck, AlertTriangle, Info, CheckCircle2, Zap, Menu, X } from "lucide-react";
import Managersidebar from "./Managersidebar";
import BottomNav from "@/components/ui/BottomNav";
import { useAuth } from "@/context/AuthContext";
import API from "@/api";
import { getDisplayName } from "@/utils/displayName";

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
  return { Icon: Info, color: "text-[#2563EB]", bg: "bg-[#EFF6FF]" };
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
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  /* Fetch notifications from dashboard API */
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/manager/shifts/dashboard/data");
      const msgs = res.data?.data?.notifications || [];

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
          text: "All shifts are fully staffed",
          time: "Now",
        });
      }

      setNotifs(built);
    } catch (err) {
      console.warn("Notification fetch failed:", err?.message);
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Fetch on mount + every 60s while tab visible; refresh when tab becomes visible */
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifs();
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchNotifs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchNotifs]);

  const unread = notifications.filter(n => !readIds.has(n.id)).length;

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  return (
    <div className="relative z-40" ref={bellRef}>
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative min-h-[44px] min-w-[44px] p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-center cursor-pointer text-[#1B3F8B] hover:bg-[#dbeafe] transition"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" aria-hidden />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 top-full mt-2
            w-80 max-w-[calc(100vw-2rem)]
            bg-white rounded-2xl shadow-xl
            border border-gray-100
            z-40
            max-h-[70vh] overflow-y-auto overflow-x-hidden
            animate-in fade-in zoom-in-95 duration-150
          "
        >

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#1B3F8B]" />
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
                className="flex items-center gap-1 text-xs text-[#1B3F8B] hover:text-[#162d5e] font-semibold transition-colors"
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
                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#1B3F8B] rounded-full animate-spin" />
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
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-2" />
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dropdownRef = useRef();
  const { user, logout } = useAuth();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setProfileOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const pageTitle = PAGE_TITLES[pathname] ?? "Manager Panel";
  const shortTitle = SHORT_PAGE_TITLES[pageTitle] ?? pageTitle;

  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-[#f1f5f9]">

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col h-full shrink-0
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Managersidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Navbar ──────────────────────────────────────── */}
        <header className="min-h-[56px] lg:min-h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10 safe-top">

          {/* Hamburger + Page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="lg:hidden -ml-2 p-3 rounded-lg text-slate-600 hover:bg-slate-100 transition flex items-center justify-center shrink-0 min-h-[48px] min-w-[48px]"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          <div className="min-w-0">
            <h2 className="font-bold text-[#0f2042] text-xl lg:text-2xl truncate max-w-[160px] sm:max-w-none">
              <span className="sm:hidden">{shortTitle}</span>
              <span className="hidden sm:inline">{pageTitle}</span>
            </h2>
            <p className="text-[#94a3b8] text-xs mt-0.5 hidden sm:block truncate">
              Manager Panel / {pageTitle}
            </p>
          </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Notification bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            {/* Profile dropdown */}
            <div className="relative z-40" ref={dropdownRef}>
              {profileOpen && (
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileOpen(false)}
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#dbeafe] transition focus:outline-none"
              >
                <div className="w-6 h-6 rounded-full bg-[#1B3F8B] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0">
                  {user?.profileImage
                    ? <img src={avatarUrl(user.profileImage)} alt="avatar" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="hidden md:block text-left leading-tight min-w-0">
                  <p className="text-[#1B3F8B] text-xs font-semibold truncate max-w-[120px]">{getDisplayName(user, "Manager")}</p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-[#64748b] transition-transform duration-200 shrink-0 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <div
                  className="
                    absolute right-0 top-full mt-2
                    w-64 max-w-[calc(100vw-2rem)]
                    bg-white rounded-2xl shadow-xl
                    border border-gray-100
                    z-40 overflow-hidden
                    animate-in fade-in zoom-in-95 duration-150
                  "
                >

                  {/* Mini profile header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-[#0f2042]">{getDisplayName(user, "Manager")}</p>
                    <p className="text-xs text-slate-500">{user?.email || ""}</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User size={15} className="text-slate-400" />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={15} className="text-slate-400" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 lg:pb-0">
          <Outlet />
        </main>

        <BottomNav />

      </div>
    </div>
  );
};

export default ManagerLayout;
