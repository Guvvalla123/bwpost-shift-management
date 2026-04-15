import React, { memo } from "react";
import ShiftRow from "./ShiftRow";
import { Users, Eye, Pencil, Trash2 } from "lucide-react";

function EmployeeTable({ employees, onEdit, onDelete, onView }) {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Users className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-base font-medium">No employees found</p>
        <p className="text-sm mt-1 text-slate-400">Try adjusting your search or add a new employee.</p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3 px-4 pb-4">
        {employees.map((emp) => {
          const active = emp.isActive !== false;
          const initial = emp.username?.[0]?.toUpperCase() || "U";
          return (
            <div
              key={emp._id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="
          w-11 h-11 rounded-full flex-shrink-0
          bg-[#1B3F8B] flex items-center
          justify-center text-white font-bold text-sm
        "
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {emp.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {emp.email}
                  </p>
                </div>
                <span
                  className={`
          text-xs px-2.5 py-1 rounded-full
          font-medium flex-shrink-0 ${
          active
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}
                >
                  {active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onView(emp)}
                  className="flex-1 min-h-11 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(emp)}
                  className="flex-1 min-h-11 text-sm font-medium rounded-lg border border-gray-300 text-[#1B3F8B] hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(emp)}
                  className="flex-1 min-h-11 text-sm font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map((emp) => (
              <ShiftRow
                key={emp._id}
                employee={emp}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default memo(EmployeeTable);
