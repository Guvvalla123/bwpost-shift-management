import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LogOut,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Users2,
  UserCheck,
  Users,
  Mail,
  Clock,
  FileText,
  BarChart2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/utils/displayName";
import BottomNav from "@/components/ui/BottomNav";

const avatarUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/w_96,h_96,c_fill,g_face,q_auto,f_auto/");
};

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "User Management",
  "/admin/managers": "Manager Management",
  "/admin/invites": "Invites",
  "/admin/employees": "Employee Management",
  "/admin/calendar": "Calendar",
  "/admin/attendance": "Attendance & Timesheets",
  "/admin/reports": "Reports & Analytics",
  "/admin/settings": "Settings",
};

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { name: "Users", path: "/admin/users", icon: Users2 },
      { name: "Managers", path: "/admin/managers", icon: UserCheck },
      { name: "Employees", path: "/admin/employees", icon: Users },
      { name: "Invites", path: "/admin/invites", icon: Mail },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Calendar", path: "/admin/calendar", icon: Clock },
      { name: "Attendance", path: "/admin/attendance", icon: FileText },
      { name: "Reports", path: "/admin/reports", icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", path: "/admin/settings", icon: Settings }],
  },
];

const AdminNavItem = ({ item, isActive, onNavigate }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={() => onNavigate?.()}
      className={`flex items-center gap-2.5 px-4 py-3 mx-2 rounded-lg text-sm transition-colors min-h-[48px] ${
        isActive
          ? "bg-[#1B3F8B] text-white font-semibold"
          : "text-white/45 hover:bg-white/5 hover:text-white/70"
      }`}
    >
      <span
        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
          isActive ? "bg-[#60A5FA] text-white" : "bg-white/10 text-white/70"
        }`}
      >
        <Icon className="w-3 h-3" strokeWidth={2} />
      </span>
      <span className="truncate">{item.name}</span>
    </Link>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => setSidebarOpen(false), [pathname]);

  const pageTitle = PAGE_TITLES[pathname] ?? "Admin Panel";

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-0 h-full shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <aside className="w-64 min-h-full flex flex-col bg-[#0f2042] h-full">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] lg:hidden">
            <span className="text-white/80 text-xs font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-white/70 hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
            <div className="flex items-baseline gap-0.5">
              <span className="font-extrabold text-white text-[15px] tracking-tight">BW</span>
              <span className="font-light text-[#60A5FA] text-[15px] tracking-tight">POST</span>
            </div>
            <span className="inline-block mt-1 text-[8px] font-bold tracking-widest uppercase text-[#60A5FA] bg-[#60A5FA]/12 px-2 py-0.5 rounded">
              Admin
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[8px] font-bold tracking-widest uppercase text-white/20 px-4 pt-5 pb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <AdminNavItem
                      key={item.path}
                      item={item}
                      isActive={pathname === item.path || pathname.startsWith(item.path + "/")}
                      onNavigate={() => setSidebarOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-3 border-t border-white/[0.06] px-3 py-2 flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#1B3F8B] border-2 border-[#60A5FA] flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
              {user?.profileImage ? (
                <img src={avatarUrl(user.profileImage)} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-[10px] font-medium truncate">{getDisplayName(user, "Admin")}</p>
              <p className="text-white/30 text-[9px] capitalize">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-auto p-1.5 text-white/25 hover:text-white/60 transition-colors rounded-lg"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="min-h-[56px] lg:min-h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 safe-top">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="lg:hidden -ml-2 p-3 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="min-w-0">
              <h2 className="font-bold text-[#0f2042] text-xl lg:text-2xl truncate max-w-[150px] sm:max-w-none">{pageTitle}</h2>
              <p className="text-[#94a3b8] text-xs mt-0.5 hidden sm:block truncate">Admin Panel / {pageTitle}</p>
            </div>
          </div>

          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3 py-2 min-h-[44px] cursor-pointer hover:bg-[#dbeafe] transition"
            >
              <div className="w-6 h-6 rounded-full bg-[#1B3F8B] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0">
                {user?.profileImage ? (
                  <img src={avatarUrl(user.profileImage)} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="text-[#1B3F8B] text-xs font-semibold hidden sm:inline max-w-[120px] truncate">
                {getDisplayName(user, "Admin")}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-[#0f2042]">{getDisplayName(user, "Admin")}</p>
                  <p className="text-xs text-slate-500">{user?.email || ""}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigate("/admin/settings");
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={15} className="text-slate-400" /> Settings
                </button>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto min-h-0 pb-20 lg:pb-0">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

export default AdminLayout;
