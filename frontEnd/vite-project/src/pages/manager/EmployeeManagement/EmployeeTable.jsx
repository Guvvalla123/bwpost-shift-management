import React, { memo } from "react";
import ShiftRow from "./ShiftRow";
import { Users, Eye, Pencil, Trash2, Key } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Users className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-base font-medium">No employees found</p>
        <p className="mt-1 text-sm text-slate-400">Try adjusting your search or add a new employee.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 px-4 pb-4 md:hidden">
        {employees.map((emp) => {
          const active = emp.isActive !== false;
          const roleLabel = emp.role === "manager" ? "Manager" : "Employee";
          return (
            <div
              key={emp._id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1B3F8B] text-sm font-bold text-white">
                  {initialsFrom(emp.username)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight text-gray-900">{emp.username}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">{emp.email}</p>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#1B3F8B]">
                      {roleLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-400">Joined {formatJoinDate(emp.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  title="View details"
                  onClick={() => onView(emp)}
                  className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1B3F8B]"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {onPasswordReset ? (
                  <button
                    type="button"
                    title="Generate Reset Link"
                    onClick={() => onPasswordReset(emp)}
                    className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#1B3F8B]"
                  >
                    <Key className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  title="Edit employee"
                  onClick={() => onEdit(emp)}
                  className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#1B3F8B]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Remove employee"
                  onClick={() => onDelete(emp)}
                  className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
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
