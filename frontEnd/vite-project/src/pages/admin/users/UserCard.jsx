// UserCard.jsx
// Shows ONE user as a card on mobile screens.
// Displays a colored avatar, name, email, role badge, and status badge.
// Admin can change the user's role or generate a password reset link.
//
// ROLE COLORS:
// Admin    → purple avatar and badge
// Manager  → blue avatar and badge
// Employee → green avatar and badge

import React from "react";
import { Shield, Users, UserCheck, Key, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";

// ROLE_BADGES - CSS classes for role badge colors
// Each role gets a distinct color to visually identify it quickly
const ROLE_BADGES = {
  admin:    "bg-purple-50 text-purple-700 border border-purple-200",
  manager:  "bg-[#EFF6FF] text-[#1B3F8B] border border-blue-100",
  employee: "bg-emerald-50 text-emerald-800 border border-emerald-100",
};

// UserCard - displays one user as a mobile-friendly card
//
// Props:
// user             - the user object to display
//                    must have: _id, username, email, role, isActive, createdAt
// onChangeRole     - function called when the shield (change role) button is clicked
//                    opens ChangeRoleModal with this user
// onResetPassword  - function called when the key button is clicked
//                    opens ResetPasswordModal for this user
// onDeleteUser     - function called when the trash button is clicked
//                    not yet implemented in original — wired up for future use
const UserCard = ({ user, onChangeRole, onResetPassword, onDeleteUser }) => {
  // Avatar background color based on user's role
  const avatarBg =
    user.role === "admin"   ? "bg-purple-600" :
    user.role === "manager" ? "bg-[#1B3F8B]" :
    "bg-green-600";

  // Get just the first letter of the username for the avatar circle
  const avatarLetter = user.username?.[0]?.toUpperCase() || "U";

  // Format join date to "Month YYYY" format
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short", year: "numeric",
      })
    : null;

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 ${
        user.isActive === false ? "opacity-70" : ""
      }`}
    >
      {/* TOP ROW: avatar + name and email + active/inactive badge */}
      <div className="flex items-center gap-3 mb-3">
        {/* Colored circle avatar with first letter */}
        <div
          className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold ${avatarBg}`}
        >
          {avatarLetter}
        </div>

        {/* Name and email */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{user.username}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>

        {/* Active or Inactive status badge */}
        <Badge variant={user.isActive !== false ? "success" : "gray"} size="sm">
          {user.isActive !== false ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* SECOND ROW: role badge + join date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Role badge with icon — color matches role */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            ROLE_BADGES[user.role] || "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {user.role === "admin"    && <Shield size={10} />}
          {user.role === "manager"  && <Users size={10} />}
          {user.role === "employee" && <UserCheck size={10} />}
          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
        </span>

        {/* When they joined */}
        {joinDate && (
          <span className="text-xs text-gray-400">Joined {joinDate}</span>
        )}
      </div>

      {/* BOTTOM ROW: action icon buttons */}
      <div className="flex items-center justify-end gap-0.5 border-t border-gray-100 pt-3">
        {/* Reset password button — hidden for admin users */}
        {user.role !== "admin" && (
          <button
            type="button"
            title="Generate reset link"
            onClick={() => onResetPassword(user)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1B3F8B] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
          >
            <Key className="h-4 w-4" />
          </button>
        )}

        {/* Change role button — only shown for active users */}
        {user.isActive !== false && (
          <button
            type="button"
            title="Change role"
            onClick={() => onChangeRole(user)}
            className="p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
          >
            <Shield className="h-4 w-4" />
          </button>
        )}

        {/* Delete button — hidden for admin users */}
        {user.role !== "admin" && (
          <button
            type="button"
            title="Delete user"
            onClick={() => onDeleteUser && onDeleteUser(user)}
            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard;
