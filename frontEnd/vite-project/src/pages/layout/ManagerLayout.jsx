// ManagerLayout.jsx
// This is the main layout wrapper for all manager pages.
// Every manager page is wrapped in this layout.
//
// WHAT THIS FILE PROVIDES:
// 1. Sidebar navigation (desktop)
//    Shows all navigation links
//    Can be collapsed to icons only
// 2. Top header bar
//    Shows page title and breadcrumb
//    Shows notification bell
//    Shows user profile button
// 3. Hamburger menu (mobile)
//    Opens overlay sidebar on mobile
// 4. Bottom navigation (mobile)
//    Quick access to main pages
// 5. Page content area
//    React Router Outlet renders here
//    Shows whichever page is currently active
//
// HOW ROUTING WORKS WITH LAYOUT:
// In App.jsx all manager routes are nested
// inside this layout component.
// The Outlet renders the active child route.
// So sidebar and header always stay visible
// while only the middle content changes.

import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const SHORT_PAGE_TITLES = {
  "Shift Management": "Shifts",
  "Employee Management": "Employees",
  "Attendance & Timesheets": "Attendance",
  "Shift Requests": "Requests",
  "Reports & Analytics": "Reports",
};
import { LogOut, Settings, User, ChevronDown, Menu, X } from "lucide-react";
import Managersidebar from "./Managersidebar";
import BottomNav from "@/components/ui/BottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/utils/displayName";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

/* avatarUrl — swaps Cloudinary `/upload/` path segment for resized face crop avatars */
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

/* ══════════════════════════════════════════════════════════════════
   MANAGER LAYOUT
══════════════════════════════════════════════════════════════════ */
// greeting — picks a friendly salutation based on time of day (used on dashboard subtext)
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const ManagerLayout = () => {
  // Whether the avatar dropdown panel in the top bar is open
  const [profileOpen, setProfileOpen] = useState(false);

  // Whether the left navigation drawer is open on phones (covers screen with overlay when true)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Root element for positioning the profile menu (captures refs for dropdown logic)
  const dropdownRef = useRef();

  const { user, logout } = useAuth();

  // Sidebar collapsed state + breakpoint flags from shared layout hook (desktop collapsible sidebar)
  const { effectiveCollapsed, toggle: toggleSidebarCollapsed, isMobile, isDesktop } = useSidebarCollapsed();

  // Closing the drawer on route change avoids the menu sticking while navigating between pages
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Same for profile dropdown — new page should dismiss the dropdown
  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  // Scrolling clears the dropdown so menus do not hover over scrolled content oddly
  useEffect(() => {
    const handleScroll = () => setProfileOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // Readable title rendered in the navbar (long form on wider screens)
  const pageTitle = PAGE_TITLES[pathname] ?? "Manager Panel";

  // Compact title rendered on narrow screens (shown in truncation-friendly header)
  const shortTitle = SHORT_PAGE_TITLES[pageTitle] ?? pageTitle;

  // Two-letter fallback avatar when Cloudinary thumbnail missing
  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  // handleLogout — ends the session via AuthContext (clears JWT / cookies upstream)
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-[#F8F9FC]">

      {/* ── Mobile sidebar overlay ───────────────────────────── */}
      {/* Dims background when drawer is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar column ──────────────────────────────────── */}
      {/* Desktop: sidebar always visible · Mobile: drawer slides from left */}
      <div
        className={cn(
          "z-40 flex h-full min-h-0 flex-col",
          isMobile &&
            "fixed inset-y-0 left-0 w-[240px] max-w-[min(20rem,90vw)] -translate-x-full transform transition-transform duration-300 ease-in-out",
          isMobile && sidebarOpen && "translate-x-0",
          !isMobile && "relative shrink-0 translate-x-0",
          (isMobile === false) && (effectiveCollapsed ? "w-16" : "w-[240px]"),
          isDesktop && "transition-[width] duration-300"
        )}
      >
        <Managersidebar
          onNavigate={() => setSidebarOpen(false)}
          effectiveCollapsed={effectiveCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      </div>

      {/* ── Main column: header + content + bottom nav ──────── */}
      <div className="min-w-0 flex flex-1 flex-col overflow-hidden transition-[flex] duration-300">

        {/* ── TOP HEADER ──────────────────────────────────────── */}
        {/* Page title strip with hamburger · notifications · profile */}
        <header className="min-h-[56px] lg:min-h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10 safe-top">

          {/* Left: Hamburger + page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="md:hidden -ml-2 p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition flex items-center justify-center shrink-0 min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          <div className="min-w-0">
            <h2 className="font-bold text-[#0f2042] text-xl lg:text-2xl truncate max-w-[160px] sm:max-w-none">
              <span className="sm:hidden">{shortTitle}</span>
              <span className="hidden sm:inline">{pageTitle}</span>
            </h2>
            {pathname === "/manager/dashboard" ? (
              <p className="mt-0.5 hidden truncate text-sm text-gray-400 lg:block">
                {greeting()}, {getDisplayName(user, "Manager")}
              </p>
            ) : (
              <p className="mt-0.5 hidden truncate text-xs text-[#94a3b8] sm:block">
                Manager Panel / {pageTitle}
              </p>
            )}
          </div>
          </div>

          {/* Right: notifications + avatar menu */}
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
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-[#0f2042]">{getDisplayName(user, "Manager")}</p>
                    <p className="text-xs text-gray-500">{user?.email || ""}</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={15} className="text-gray-400" />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={15} className="text-gray-400" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
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

        {/* ── ROUTED PAGE BODY ─────────────────────────────── */}
        {/* Child route renders here */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden min-h-0",
            "animate-in fade-in duration-200",
            "md:pb-0 pb-20"
          )}
        >
          <Outlet />
        </main>

        {/* ── MOBILE BOTTOM TAB BAR ─────────────────────────── */}
        <BottomNav />

      </div>
    </div>
  );
};

export default ManagerLayout;
