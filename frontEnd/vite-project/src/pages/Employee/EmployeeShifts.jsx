import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import ShiftTable from "./ShiftTable";

const EmployeeShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Available Shifts
  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/employee/shifts/Availableshifts",
        { withCredentials: true }
      );
      setShifts(res.data.data);
    } catch (error) {
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Apply Shift
  const handleApply = async (shiftId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/employee/shifts/applyForShift",
        { shiftId },
        { withCredentials: true }
      );
      toast.success("Applied successfully");
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Apply failed");
    }
  };

  // Cancel Shift
  const handleCancel = async (shiftId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/employee/shifts/cancelShift",
        { shiftId },
        { withCredentials: true }
      );
      toast.success("Cancelled successfully");
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancel failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Available Shifts</h1>
          <p className="text-slate-600">Browse and apply for available shifts</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <ShiftTable
              shifts={shifts}
              onApply={handleApply}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeShifts;
