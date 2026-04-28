// WeeklyHoursCard.jsx
// Shows the total hours the employee has worked this week.
// Also shows how many hours remain before hitting the 40-hour limit.
// The card color changes as the employee approaches or exceeds the limit:
//   Green  = under 35 hours (plenty remaining)
//   Amber  = 35–39 hours (getting close)
//   Gray   = 40+ hours (limit reached)

import React from "react";

// WeeklyHoursCard - displays weekly hour summary with color feedback
//
// Props:
// weeklyInfo  - object with totalMinutes and remainingMinutes
//               null means data is not available yet (card is hidden)
// limitHours  - the weekly hour limit to compare against
//               defaults to 40 if not provided
const WeeklyHoursCard = ({ weeklyInfo, limitHours = 40 }) => {
  // Don't render if no data available
  if (!weeklyInfo) return null;

  const totalMinutes     = weeklyInfo.totalMinutes     ?? 0;
  const remainingMinutes = weeklyInfo.remainingMinutes ?? 0;
  const limitMinutes     = limitHours * 60;

  // Determine card color based on hours worked
  const cardClass =
    totalMinutes >= limitMinutes
      ? "border-gray-200 bg-slate-100/90 text-gray-700"
      : totalMinutes >= 35 * 60
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-emerald-200 bg-emerald-50 text-emerald-950";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${cardClass}`}>
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">This week</p>

      {/* Hours summary text */}
      <p className="mt-1 text-sm font-medium tabular-nums">
        {(totalMinutes / 60).toFixed(1)} hrs this week
        {totalMinutes >= limitMinutes
          ? ` (${limitHours} hr limit reached)`
          : ` (${(remainingMinutes / 60).toFixed(1)} hrs remaining to ${limitHours}hr limit)`}
      </p>
    </div>
  );
};

export default WeeklyHoursCard;
