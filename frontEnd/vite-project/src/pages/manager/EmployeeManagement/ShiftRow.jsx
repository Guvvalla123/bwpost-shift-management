import { Pencil, Trash2, Eye } from "lucide-react";

/* Deterministic pastel gradient per employee initial */
const AVATAR_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];
const avatarGradient = (name = "") =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const formatJoinDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ShiftRow = ({ employee, onEdit, onDelete, onView }) => {
  const initials = (employee.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="group hover:bg-blue-50/40 transition-colors duration-150">
      {/* Employee info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(
              employee.username
            )} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {employee.username}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{employee.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Employee
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      </td>

      {/* Joined */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {formatJoinDate(employee.createdAt)}
      </td>

      {/* Actions */}
      {/* <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(employee)}
            title="View Details"
            className="p-2 rounded-lg text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(employee)}
            title="Edit Employee"
            className="p-2 rounded-lg text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(employee)}
            title="Delete Employee"
            className="p-2 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td> */}
    </tr>
  );
};

export default ShiftRow;
