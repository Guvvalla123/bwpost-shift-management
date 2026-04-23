import React, { useEffect, useState, useCallback } from "react";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Calendar } from "lucide-react";
import { Pagination, SkeletonTable, SkeletonList, EmptyState, ErrorState } from "@/components/ui";
import ShiftTable from "./ShiftTable";

const EmployeeShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const fetchShifts = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError(false);
    }
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      const res = await API.get(`/api/employee/shifts/available-shifts?${params}`);
      const { data, pagination } = res.data;
      setShifts(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(pagination?.total ?? 0);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) {
        setFetchError(true);
        setShifts([]);
        setTotalPages(1);
        setTotalItems(0);
      }
      if (import.meta.env.DEV) console.error("Refresh error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchShifts(false);
  }, [fetchShifts]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchShifts(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchShifts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchShifts(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchShifts]);

  const handleApply = useCallback(async (shiftId) => {
    try {
      await API.post(
        "/api/employee/shifts/applyForShift",
        { shiftId }
      );
      toast.success("Applied successfully");
      fetchShifts(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Apply failed"));
    }
  }, [fetchShifts]);

  const handleCancel = useCallback(async (shiftId) => {
    try {
      await API.post(
        "/api/employee/shifts/cancelShift",
        { shiftId }
      );
      toast.success("Application withdrawn");
      fetchShifts(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Cancel failed"));
    }
  }, [fetchShifts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#EFF6FF]/40 to-[#f1f5f9] px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Available Shifts</h1>
              <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Browse and apply for available shifts</p>
            </div>
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
              title="Failed to load shifts"
              description="Could not load available shifts. Please try again."
              onRetry={() => fetchShifts(false)}
            />
          </div>
        ) : shifts.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No shifts available"
            description="Check back later for new shift opportunities."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <ShiftTable
              shifts={shifts}
              onApply={handleApply}
              onCancel={handleCancel}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={20}
              onPageChange={setCurrentPage}
              isLoading={loading}
            />
            <p className="text-xs text-gray-400 text-center py-3 md:hidden">
              Updated{" "}
              {lastUpdated.toLocaleTimeString("en-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeShifts;
