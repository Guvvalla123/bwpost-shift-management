const variants = {
  default: "bg-white border border-gray-100 shadow-sm",
  navy: "bg-[#1B3F8B] text-white border border-[#152f6b] shadow-md shadow-[#1B3F8B]/15",
  green: "bg-emerald-50 border border-emerald-100/80",
  amber: "bg-amber-50 border border-amber-100/80",
  red: "bg-red-50 border border-red-100/80",
};

const labelStyles = {
  default: "text-gray-500",
  navy: "text-white/80",
  green: "text-emerald-700/90",
  amber: "text-amber-800/90",
  red: "text-red-800/90",
};

const valueStyles = {
  default: "text-gray-900",
  navy: "text-white",
  green: "text-emerald-800",
  amber: "text-amber-900",
  red: "text-red-900",
};

const iconBoxStyles = {
  default: "bg-blue-50 text-[#1B3F8B]",
  navy: "bg-white/15 text-white",
  green: "bg-emerald-100/90 text-emerald-800",
  amber: "bg-amber-100/90 text-amber-900",
  red: "bg-red-100/90 text-red-800",
};

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {'default'|'navy'|'green'|'amber'|'red'} [props.variant]
 * @param {React.ComponentType<{ className?: string; strokeWidth?: number }>} [props.icon]
 */
export default function KpiCard({ label, value, variant = "default", icon: Icon }) {
  const v = variants[variant] || variants.default;
  const ls = labelStyles[variant] || labelStyles.default;
  const vs = valueStyles[variant] || valueStyles.default;
  const ib = iconBoxStyles[variant] || iconBoxStyles.default;

  return (
    <div
      className={`flex h-full min-h-[120px] flex-col rounded-2xl px-4 py-4 sm:px-5 ${v}`}
    >
      <div className="flex shrink-0 items-start">
        {Icon ? (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ib}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        ) : null}
      </div>
      <p className={`mt-3 text-xs font-medium ${ls}`}>{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${vs}`}>{value}</p>
    </div>
  );
}
