import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, CalendarDays, ClipboardList,
    CheckCircle2, User, Briefcase, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
    { name: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
    { name: "Available Shifts", path: "/employee/AllShifts", icon: CalendarDays },
    { name: "My Shifts", path: "/employee/myshifts", icon: CheckCircle2 },
    { name: "My Requests", path: "/employee/requests", icon: ClipboardList },
    { name: "My Profile", path: "/employee/profile", icon: User },
];

const EmployeeSidebar = () => {
    const { pathname } = useLocation();

    return (
        <aside className="w-64 min-h-screen flex flex-col bg-slate-900 shadow-2xl border-r border-slate-800/50">

            {/* Brand */}
            <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Briefcase size={15} className="text-emerald-400" />
                </div>
                <div className="leading-tight">
                    <span className="text-white font-bold text-base tracking-tight">
                        BW<span className="text-emerald-400">POST</span>
                    </span>
                    <p className="text-slate-500 text-[10px] font-medium tracking-widest uppercase">
                        Employee Portal
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                                    ? "bg-emerald-500/20 text-white"
                                    : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-100"
                                }`}
                        >
                            {/* Active left pill */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
                            )}
                            {/* Icon box */}
                            <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shrink-0
                ${isActive
                                    ? "bg-emerald-500/30 text-emerald-300 shadow-sm"
                                    : "bg-slate-700/50 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
                                }`}
                            >
                                <Icon size={15} />
                            </span>
                            <span className="flex-1 truncate">{item.name}</span>
                            {isActive && <ChevronRight size={13} className="text-emerald-400 shrink-0" />}
                        </Link>
                    );
                })}
            </nav>


        </aside>
    );
};


export default EmployeeSidebar;
