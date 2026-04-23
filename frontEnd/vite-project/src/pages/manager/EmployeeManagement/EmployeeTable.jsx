import React, { memo } from "react";
import ShiftRow from "./ShiftRow";
import { Users, Eye, Pencil, Trash2, Key } from "lucide-react";
import { Badge } from "@/components/ui";

const initialsFrom = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const formatJoinDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function EmployeeTable({ employees, onEdit, onDelete, onView, onPasswordReset }) {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Users className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-base font-medium">No employees found</p>
        <p className="mt-1 text-sm text-gray-400">Try adjusting your search or add a new employee.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 px-4 pb-4 md:hidden">
        {employees.map((emp) => {
          const active = emp.isActive !== false;
          const isManager = emp.role === "manager";
          const weeklyHrs = emp.weeklyHours ?? 0;
          const hrsPct = Math.min(Math.round((weeklyHrs / 40) * 100), 100);
          const hrsBarColor =
            weeklyHrs >= 40 ? "bg-red-400" : weeklyHrs >= 30 ? "bg-amber-400" : "bg-green-500";
          return (
            <div
              key={emp._id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              {/* TOP ROW: avatar + name/email + active badge */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3F8B] text-sm font-semibold text-white">
                  {initialsFrom(emp.username)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-gray-900 truncate">{emp.username}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{emp.email}</p>
                </div>
                <Badge variant={active ? "success" : "gray"} className="shrink-0">
                  {active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* MIDDLE ROW: role badge + join date */}
              <div className="mb-3 flex items-center justify-between">
                <Badge variant={isManager ? "navy" : "info"}>
                  {isManager ? "Manager" : "Employee"}
                </Badge>
                <span className="text-xs text-gray-400">Joined {formatJoinDate(emp.createdAt)}</span>
              </div>

              {/* WEEKLY HOURS ROW */}
              <div className="mb-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                  <span>This week</span>
                  <span className="tabular-nums font-medium">{weeklyHrs} of 40 hrs</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${hrsBarColor}`}
                    style={{ width: `${hrsPct}%` }}
                  />
                </div>
              </div>

              {/* BOTTOM ROW: icon action buttons */}
              <div className="flex items-center justify-end gap-0.5 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  title="View details"
                  onClick={() => onView(emp)}
                  className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {onPasswordReset ? (
                  <button
                    type="button"
                    title="Generate Reset Link"
                    onClick={() => onPasswordReset(emp)}
                    className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-[#EFF6FF] hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                  >
                    <Key className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  title="Edit employee"
                  onClick={() => onEdit(emp)}
                  className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-[#EFF6FF] hover:text-[#1B3F8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Remove employee"
                  onClick={() => onDelete(emp)}
                  className="rounded-lg p-2 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <ShiftRow
                key={emp._id}
                employee={emp}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                onPasswordReset={onPasswordReset}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default memo(EmployeeTable);
