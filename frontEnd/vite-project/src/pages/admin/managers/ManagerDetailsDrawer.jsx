// ManagerDetailsDrawer.jsx
// Slide-in drawer from the right showing manager profile summary.
// Shows avatar, username, email, Role = Manager, Join date, overview text.

import React from "react";
import { ArrowLeft, Calendar, ShieldCheck } from "lucide-react";

const AVATAR_GRADIENTS = [
  "from-blue-600 to-[#162d5e]",
  "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

function avatarGradient(name = "") {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function fmtDate(iso) {
  return iso
    ? new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
}

// InfoPill — small metric card row used under the gradient header
function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

// ManagerDetailsDrawer — fullscreen-height panel on md+ widths
//
// Props:
// manager - user object when drawer is visible; drawer does not render if null
// onClose - called when Back is clicked or backdrop is clicked
const ManagerDetailsDrawer = ({ manager, onClose }) => {
  if (!manager) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header with avatar */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#162d5e] px-6 pt-8 pb-10">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm mb-6 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(manager.username)} flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white/20`}
            >
              {initials(manager.username)}
            </div>
            <div>
              <p className="text-white font-bold text-xl">{manager.username}</p>
              <p className="text-blue-200 text-sm mt-0.5">{manager.email}</p>
            </div>
          </div>
        </div>

        <div className="-mt-5 mx-6 grid grid-cols-2 gap-3">
          <InfoPill icon={ShieldCheck} label="Role" value="Manager" />
          <InfoPill icon={Calendar} label="Joined" value={fmtDate(manager.createdAt)} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Overview
          </p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-600">
              Managers handle day-to-day operations including shift assignments, request approvals, and employee management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDetailsDrawer;
