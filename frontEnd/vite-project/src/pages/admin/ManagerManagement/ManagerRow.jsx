import { memo } from "react";
import { Pencil, Trash2, Eye, Briefcase } from "lucide-react";

const AVATAR_GRADIENTS = [
  "from-blue-600 to-[#162d5e]",
  "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];
const avatarGradient = (name = "") =>
  AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const formatJoinDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ManagerRow = ({ manager, onEdit, onDelete, onView }) => {
  const initials = (manager.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActive = manager.isActive !== false;

  return (
    <tr className={`group hover:bg-blue-50/40 transition-colors duration-150 ${!isActive ? "opacity-60" : ""}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(
              manager.username
            )} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{manager.username}</p>
            <p className="text-xs text-gray-400 mt-0.5">{manager.email}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Briefcase className="h-3 w-3" /> Manager
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-gray-600"
        }`}>
          {isActive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </>
          ) : (
            "Deactivated"
          )}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatJoinDate(manager.createdAt)}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(manager)}
            title="View Details"
            className="p-2 rounded-lg text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
          >
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(manager)}
              title="Edit Manager"
              className="p-2 rounded-lg text-gray-400 hover:bg-[#EFF6FF] hover:text-[#1B3F8B] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && isActive && (
            <button
              onClick={() => onDelete(manager)}
              title="Deactivate Manager"
              className="p-2 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(ManagerRow);
