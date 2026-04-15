import React from "react";
import { Briefcase, Eye, Pencil, Trash2 } from "lucide-react";
import ManagerRow from "./ManagerRow";

const ManagerTable = ({ managers, onEdit, onDelete, onView }) => {
  if (managers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Briefcase className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-base font-medium">No managers found</p>
        <p className="text-sm mt-1 text-slate-400">Try adjusting your search or add a new manager.</p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3 px-4 pb-4">
        {managers.map((manager) => {
          const isActive = manager.isActive !== false;
          const initials = (manager.username || "?")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          return (
            <div
              key={manager._id}
              className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${!isActive ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1B3F8B] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{manager.username}</p>
                  <p className="text-xs text-gray-500 truncate">{manager.email}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 border ${
                    isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Joined:{" "}
                {manager.createdAt
                  ? new Date(manager.createdAt).toLocaleDateString("en-DE")
                  : "—"}
              </p>
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onView(manager)}
                  className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(manager)}
                      className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-gray-300 text-[#1B3F8B] hover:bg-gray-50"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && isActive && (
                    <button
                      type="button"
                      onClick={() => onDelete(manager)}
                      className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deactivate
                    </button>
                  )}
                </div>
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
                Manager
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
            {managers.map((m) => (
              <ManagerRow
                key={m._id}
                manager={m}
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
};

export default ManagerTable;
