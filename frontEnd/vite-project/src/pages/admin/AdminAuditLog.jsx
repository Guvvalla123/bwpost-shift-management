import React, { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import API from "@/api";
import { getApiErrorMessage } from "@/utils/apiError";
import { Badge, Pagination, SkeletonTable } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const fmtTarget = (row) => {
  if (row?.targetType && row?.targetId) return `${row.targetType} ${String(row.targetId).slice(-6)}`;
  if (row?.targetType) return row.targetType;
  return "—";
};

const AdminAuditLog = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [err, setErr] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(
    async (isRefresh) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErr(false);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (action) params.set("action", action);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const res = await API.get(`/api/admin/audit-logs?${params}`);
        const d = res.data;
        setRows(Array.isArray(d.data) ? d.data : []);
        setTotalPages(d.pagination?.totalPages ?? 1);
      } catch (e) {
        setErr(true);
        setRows([]);
        if (!isRefresh) {
          console.warn(getApiErrorMessage(e, "Failed to load audit log"));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch, action, from, to]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const fetchDataSilent = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (action) params.set("action", action);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await API.get(`/api/admin/audit-logs?${params}`);
      const d = res.data;
      setRows(Array.isArray(d.data) ? d.data : []);
      setTotalPages(d.pagination?.totalPages ?? 1);
    } catch {
      /* silent — keep previous data */
    }
  }, [page, debouncedSearch, action, from, to]);

  useAutoRefresh(fetchDataSilent, 60_000);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">System activity and changes</p>
      </header>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        <div className="w-full flex-1 min-w-[12rem]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search action or IP"
              className="w-full h-12 pl-10 pr-4 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B] md:text-sm"
            />
          </div>
        </div>
        <div className="w-full min-w-[10rem] md:w-48">
          <label htmlFor="audit-action" className="text-sm font-medium text-gray-700 mb-1 block">
            Action
          </label>
          <input
            id="audit-action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. user.create"
            className="w-full h-12 px-4 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 md:text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:contents">
          <div>
            <label htmlFor="from-d" className="text-sm font-medium text-gray-700 mb-1 block">
              From
            </label>
            <input
              id="from-d"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="w-full h-12 px-3 text-base border border-gray-200 rounded-xl md:text-sm"
            />
          </div>
          <div>
            <label htmlFor="to-d" className="text-sm font-medium text-gray-700 mb-1 block">
              To
            </label>
            <input
              id="to-d"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="w-full h-12 px-3 text-base border border-gray-200 rounded-xl md:text-sm"
            />
          </div>
        </div>
      </div>

      {loading && !rows.length ? (
        <SkeletonTable rows={6} />
      ) : err && !rows.length ? (
        <p className="text-sm text-red-600">Could not load audit log.</p>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {r.actorId?.username || r.actorId?.email || "—"}
                      </p>
                      {r.actorId?.role && (
                        <Badge variant="navy" size="sm" className="mt-0.5">
                          {r.actorId.role}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{r.action}</td>
                    <td className="px-4 py-3 text-xs">{fmtTarget(r)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{r.ip || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={r.details ? JSON.stringify(r.details) : ""}>
                      {r.details != null ? JSON.stringify(r.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {rows.map((r) => (
              <div
                key={r._id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {r.actorId?.username || r.actorId?.email || "Unknown"}
                    </p>
                    {r.actorId?.role && (
                      <Badge variant="navy" size="sm" className="mt-1">
                        {r.actorId.role}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-2 font-mono">{r.action}</p>
                <p className="text-xs text-gray-500 mt-1">{fmtTarget(r)}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{r.ip || "—"}</p>
                {r.details && (
                  <pre className="text-[10px] bg-gray-50 rounded-lg p-2 mt-2 overflow-x-auto text-gray-600">
                    {JSON.stringify(r.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading || refreshing}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAuditLog;
