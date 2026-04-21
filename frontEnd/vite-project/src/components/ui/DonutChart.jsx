import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const EMPTY_GRAY = "#e5e7eb";

/**
 * @param {{ name: string; value: number; color: string }[]} data
 * @param {string} [centerValue]
 * @param {string} [centerLabel]
 * @param {number} [size]
 */
export default function DonutChart({
  data = [],
  centerValue = "",
  centerLabel = "",
  size = 110,
}) {
  const safe = Array.isArray(data) ? data : [];
  const allZero = safe.length === 0 || safe.every((d) => !Number(d.value));
  const chartData = allZero
    ? [{ name: "empty", value: 1, color: EMPTY_GRAY }]
    : safe.map((d) => ({
        name: d.name,
        value: Math.max(0, Number(d.value) || 0),
        color: d.color,
      }));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            startAngle={90}
            endAngle={-270}
            paddingAngle={3}
            strokeWidth={0}
            isAnimationActive={!allZero}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <p className="text-lg font-bold tabular-nums leading-tight text-gray-900">{centerValue}</p>
        {centerLabel ? (
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">{centerLabel}</p>
        ) : null}
      </div>
    </div>
  );
}
