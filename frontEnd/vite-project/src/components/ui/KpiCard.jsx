const variants = {
  default: "bg-white border border-gray-100 shadow-sm",
  navy: "bg-[#1B3F8B] text-white border border-[#152f6b] shadow-md shadow-[#1B3F8B]/15",
  green: "bg-emerald-50 border border-emerald-100/80",
  amber: "bg-amber-50 border border-amber-100/80",
};

const labelStyles = {
  default: "text-gray-500",
  navy: "text-white/80",
  green: "text-emerald-700/90",
  amber: "text-amber-800/90",
};

const valueStyles = {
  default: "text-gray-900",
  navy: "text-white",
  green: "text-emerald-800",
  amber: "text-amber-900",
};

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {'default'|'navy'|'green'|'amber'} [props.variant]
 */
export default function KpiCard({ label, value, variant = "default" }) {
  const v = variants[variant] || variants.default;
  const ls = labelStyles[variant] || labelStyles.default;
  const vs = valueStyles[variant] || valueStyles.default;

  return (
    <div className={`rounded-2xl px-5 py-5 ${v}`}>
      <p className={`text-xs font-medium ${ls}`}>{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${vs}`}>{value}</p>
    </div>
  );
}
