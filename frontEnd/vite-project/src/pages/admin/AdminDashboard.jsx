import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SkeletonKpi, SkeletonDonutPlaceholder, ErrorState, KpiCard, DonutChart } from "@/components/ui";
import { Users2, UserCheck, Users, Mail } from "lucide-react";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/apiError";
import { getDisplayName } from "@/utils/displayName";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

function DonutLegendRows({ rows }) {
  return (
    <ul className="mt-3 w-full space-y-2">
      {rows.map((row) => (
        <li key={row.name} className="flex items-center justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-gray-600">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
            <span className="truncate">{row.name}</span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-gray-900">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [counts, setCounts] = useState({
    totalUsers: 0,
    adminUsers: 0,
    managerUsers: 0,
    employeeUsers: 0,
    pendingInvites: 0,
  });
  const [invites, setInvites] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [
        totalRes,
        adminRes,
        mgrRes,
        empRes,
        invCountRes,
        invListRes,
      ] = await Promise.all([
        API.get("/api/admin/users?page=1&limit=1"),
        API.get("/api/admin/users?page=1&limit=1&role=admin"),
        API.get("/api/admin/users?page=1&limit=1&role=manager"),
        API.get("/api/admin/users?page=1&limit=1&role=employee"),
        API.get("/api/invites?page=1&limit=1&used=false"),
        API.get("/api/invites?page=1&limit=8&used=false"),
      ]);
      setCounts({
        totalUsers: totalRes.data?.pagination?.total ?? 0,
        adminUsers: adminRes.data?.pagination?.total ?? 0,
        managerUsers: mgrRes.data?.pagination?.total ?? 0,
        employeeUsers: empRes.data?.pagination?.total ?? 0,
        pendingInvites: invCountRes.data?.pagination?.total ?? 0,
      });
      const list = invListRes.data?.data;
      setInvites(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setFetchError(true);
        toast.error(getApiErrorMessage(err, "Failed to load dashboard"));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const donutData = useMemo(
    () => [
      { name: "Admin", value: counts.adminUsers, color: "#7c3aed" },
      { name: "Manager", value: counts.managerUsers, color: "#1B3F8B" },
      { name: "Employee", value: counts.employeeUsers, color: "#059669" },
    ],
    [counts.adminUsers, counts.managerUsers, counts.employeeUsers],
  );

  const legendRows = donutData.map((d) => ({ ...d }));

  if (loading) {
    return (
      <div className="min-h-full space-y-6 bg-[#F8F9FC] p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="h-4 w-40 max-w-full animate-pulse rounded bg-gray-200" />
              <SkeletonDonutPlaceholder />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-full bg-[#F8F9FC] p-6">
        <ErrorState title="Failed to load dashboard" description="Could not load admin data. Please try again." onRetry={fetchDashboard} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8F9FC]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            {greeting()}, {getDisplayName(user, "Admin")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard variant="navy" icon={Users2} label="Total Users" value={counts.totalUsers} />
          <KpiCard variant="default" icon={UserCheck} label="Total Managers" value={counts.managerUsers} />
          <KpiCard variant="green" icon={Users} label="Total Employees" value={counts.employeeUsers} />
          <KpiCard variant="amber" icon={Mail} label="Pending Invites" value={counts.pendingInvites} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-7">
            <h2 className="text-sm font-semibold text-slate-900">Users by role</h2>
            <p className="text-xs text-gray-400">Distribution across the system</p>
            <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-start sm:gap-8">
              <DonutChart
                data={donutData}
                size={140}
                centerValue={String(counts.totalUsers)}
                centerLabel="users"
              />
              <DonutLegendRows rows={legendRows} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-5">
            <h2 className="text-sm font-semibold text-slate-900">Recent invites</h2>
            <p className="text-xs text-gray-400">Pending registration links</p>
            <div className="mt-4 space-y-3">
              {invites.length === 0 ? (
                <p className="text-sm text-slate-500">No pending invites.</p>
              ) : (
                invites.map((inv) => (
                  <div
                    key={inv._id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{inv.email}</span>
                      <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#1B3F8B]">
                        {inv.role || "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">Pending</span>
                      <span>{fmtDate(inv.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
