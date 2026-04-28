// ManagerCard.jsx
// Shows ONE manager as a card on mobile.
// Displays avatar, name, email, Active/Inactive badge, joined date.
// Action buttons: View, Deactivate (if active), Reset password key.

import React from "react";
import { Eye, Trash2, Key } from "lucide-react";

// ManagerCard - mobile-only card component
//
// Props:
// manager         - manager user object (_id, username, email, isActive, createdAt)
// onViewDetails   - called when View is clicked
// onDeactivate    - called with manager id when Deactivate is clicked (only shown if active)
// onResetPassword - called when the key (reset password) icon is clicked
const ManagerCard = ({ manager, onViewDetails, onDeactivate, onResetPassword }) => {
  const isActive = manager.isActive !== false;

  const initials = (manager.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
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
          onClick={() => onViewDetails(manager)}
          className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            title="Generate password reset link"
            onClick={() => onResetPassword(manager)}
            className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all duration-150"
          >
            <Key className="w-4 h-4" />
            Reset link
          </button>
          {isActive && (
            <button
              type="button"
              onClick={() => onDeactivate(manager._id)}
              className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Deactivate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerCard;
