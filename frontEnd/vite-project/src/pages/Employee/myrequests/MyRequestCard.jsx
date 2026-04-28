// MyRequestCard.jsx
// Shows ONE shift request as a card on mobile screens.
// Shows the request type badge, shift name, submitted date, reason,
// and status (pending / approved / rejected).
// For pending requests: shows a Cancel Request button.

import React from "react";
import {
  ArrowRightLeft, LogOut as LeaveIcon,
  CheckCircle, XCircle,
} from "lucide-react";

// TYPE_CFG - badge style per request type
const TYPE_CFG = {
  leave:        { label: "Leave",        Icon: LeaveIcon,      badge: "bg-red-100 text-red-700 border-red-200" },
  shift_change: { label: "Shift Change", Icon: ArrowRightLeft, badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

// STATUS_CFG - badge and border-left style per status
const STATUS_CFG = {
  pending:  { label: "Pending",  badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse", border: "border-l-4 border-l-amber-500" },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500",            border: "border-l-4 border-l-green-500" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700",         dot: "bg-red-500",                border: "border-l-4 border-l-red-400" },
};

// fmtDate - formats date to "Mar 15, 2024"
function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

// MyRequestCard - mobile card for one employee request
//
// Props:
// request      - the request object to display
// isCancelling - true while the cancel API call is running
//                disables the Cancel button
// onCancel     - function called when Cancel Request is clicked
//                receives the request._id string
const MyRequestCard = ({ request, isCancelling, onCancel }) => {
  const status    = request.status || "pending";
  const typeCfg   = TYPE_CFG[request.type]  || TYPE_CFG.leave;
  const statusCfg = STATUS_CFG[status]      || STATUS_CFG.pending;
  const TypeIcon  = typeCfg.Icon;

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 ${statusCfg.border}`}
    >
      {/* TOP ROW: type badge + status badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeCfg.badge}`}>
          <TypeIcon size={10} />
          {typeCfg.label}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* SECOND ROW: shift name + submitted date */}
      <div className="mb-3">
        <p className="font-bold text-sm text-gray-900 line-clamp-1">
          {request.currentShift?.shiftTitle || "Shift"}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Submitted {fmtDate(request.createdAt)}
        </p>
      </div>

      {/* THIRD ROW: reason quote (if any) */}
      {request.reason && (
        <div className="border-l-2 border-gray-200 pl-3 py-1 mb-3">
          <p className="text-sm text-gray-500 italic line-clamp-2">{request.reason}</p>
        </div>
      )}

      {/* BOTTOM ROW: action or status indicator */}
      <div className="border-t border-gray-100 pt-3">
        {status === "pending" && (
          // Cancel button — calls onCancel with request ID
          <button
            type="button"
            onClick={() => onCancel(request._id)}
            disabled={isCancelling}
            className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all duration-150 active:scale-95 disabled:opacity-60"
          >
            {isCancelling ? "Cancelling…" : "Cancel Request"}
          </button>
        )}
        {status === "approved" && (
          <div className="flex items-center justify-center gap-1.5 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Approved</span>
          </div>
        )}
        {status === "rejected" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-red-500">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            {/* Manager's rejection note (if provided) */}
            {request.managerNote && (
              <p className="text-xs text-gray-400 text-center">{request.managerNote}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequestCard;
