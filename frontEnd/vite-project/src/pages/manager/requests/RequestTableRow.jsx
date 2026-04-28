// RequestTableRow.jsx
// Shows ONE shift request as a table row on desktop screens.
// Displays employee avatar, type badge, shift info,
// reason, status badge, submitted date, and action buttons.

import React from "react";
import {
  CheckCircle2, XCircle, MessageSquare,
  LogOut as LeaveIcon, ArrowRightLeft,
} from "lucide-react";

// GRADS - gradient colors for employee avatar squares
const GRADS = [
  "from-blue-500 to-[#162d5e]",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
];

function getGradient(name = "") {
  return GRADS[(name.charCodeAt(0) || 0) % GRADS.length];
}
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
}

// TYPE_CFG - badge styles for each request type
const TYPE_CFG = {
  leave:        { label: "Leave",        Icon: LeaveIcon,      badge: "bg-red-100 text-red-700 border-red-200" },
  shift_change: { label: "Shift Change", Icon: ArrowRightLeft, badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

// STATUS_CFG - badge and row styles for each status
const STATUS_CFG = {
  pending:  { label: "Pending",  badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse", row: "bg-yellow-50/50" },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500",           row: "bg-emerald-50/30" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700",         dot: "bg-red-500",               row: "bg-red-50/20" },
};

// RequestTableRow - renders one request as a <tr> inside a <tbody>
//
// Props:
// request      - the request object to display
// isProcessing - true while an API call is running for this request
//                disables the action buttons
// onApprove    - function called when Approve button is clicked
// onReject     - function called when Reject button is clicked
const RequestTableRow = ({ request, isProcessing, onApprove, onReject }) => {
  const typeCfg   = TYPE_CFG[request.type]   || TYPE_CFG.leave;
  const statusCfg = STATUS_CFG[request.status] || STATUS_CFG.pending;
  const TypeIcon  = typeCfg.Icon;

  return (
    <tr className={`transition-all hover:brightness-[0.97] ${statusCfg.row}`}>
      {/* Employee column: avatar + username */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getGradient(request.employee?.username)} flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden`}
          >
            {request.employee?.profileImage
              ? <img src={request.employee.profileImage} alt="" className="w-full h-full object-cover" />
              : getInitials(request.employee?.username || "")}
          </div>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[110px]">
            {request.employee?.username || "—"}
          </span>
        </div>
      </td>

      {/* Type column: leave or shift_change badge */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeCfg.badge}`}>
          <TypeIcon size={10} />
          {typeCfg.label}
        </span>
      </td>

      {/* Shift column: current and requested shift names */}
      <td className="px-5 py-3.5">
        <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
          {request.currentShift?.shiftTitle || "—"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtDate(request.currentShift?.shiftStartTime)}
        </p>
        {request.requestedShift && (
          <p className="text-xs text-amber-600 mt-0.5">
            → {request.requestedShift.shiftTitle}
          </p>
        )}
      </td>

      {/* Reason column: employee reason + manager note */}
      <td className="px-5 py-3.5">
        <p className="text-xs text-gray-500 italic max-w-[160px] truncate">
          {request.reason || <span className="not-italic text-gray-300">—</span>}
        </p>
        {request.managerNote && (
          <p className="text-xs text-[#1B3F8B] mt-0.5 flex items-center gap-1 max-w-[160px] truncate">
            <MessageSquare size={10} />
            {request.managerNote}
          </p>
        )}
      </td>

      {/* Status column: colored badge with animated dot */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </td>

      {/* Submitted date column */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <p className="text-xs font-medium text-gray-700">{fmtDate(request.createdAt)}</p>
      </td>

      {/* Actions column: approve/reject for pending, resolved date otherwise */}
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        {request.status === "pending" ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onApprove(request)}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all duration-150 shadow-sm active:scale-95 disabled:opacity-60"
            >
              <CheckCircle2 size={12} /> Approve
            </button>
            <button
              type="button"
              onClick={() => onReject(request)}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all duration-150 active:scale-95 disabled:opacity-60"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        ) : (
          /* Show resolution date for already-resolved requests */
          <span className="text-xs text-gray-300">
            {request.resolvedAt ? fmtDate(request.resolvedAt) : "—"}
          </span>
        )}
      </td>
    </tr>
  );
};

export default RequestTableRow;
