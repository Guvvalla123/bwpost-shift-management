import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Settings, User, Bell, ChevronDown } from "lucide-react";
import Managersidebar from "./Managersidebar";

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

/* ── Layout ──────────────────────────────────────────────────────── */
const ManagerLayout = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dropdownRef = useRef();

  const pageTitle = PAGE_TITLES[pathname] ?? "Manager Panel";

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

  const handleLogout = () => navigate("/login");

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
            <button
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors duration-150"
              title="Notifications"
            >
              <Bell size={16} />
              {/* Red dot badge */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

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
                  M
                </div>
                {/* Name + role */}
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-sm font-semibold text-slate-800">Manager</p>
                  <p className="text-xs text-slate-400">Admin</p>
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
                    <p className="text-sm font-bold text-slate-900">Manager</p>
                    <p className="text-xs text-slate-400">manager@bwpost.de</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { navigate("/manager/profile"); setProfileOpen(false); }}
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
