const pulse = "animate-pulse bg-gray-200";

export function SkeletonLine({ width = "100%", height = "1rem", className = "" }) {
  return (
    <div
      className={`rounded ${pulse} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonRow({ cols = 4, className = "" }) {
  return (
    <div
      className={`grid gap-4 py-2 ${className}`.trim()}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {[...Array(cols)].map((_, j) => (
        <div key={j} className={`h-4 rounded ${pulse}`} aria-hidden />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <div
        className="grid gap-4 border-b border-gray-100 pb-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {[...Array(cols)].map((_, i) => (
          <div key={i} className={`h-3 rounded ${pulse}`} aria-hidden />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div
      className={`space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`.trim()}
      aria-hidden
    >
      <SkeletonLine width="40%" height="0.75rem" />
      <div className="space-y-2">
        {[...Array(lines)].map((_, i) => (
          <SkeletonLine key={i} width={i === lines - 1 ? "70%" : "100%"} height="0.875rem" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonKpi({ className = "" }) {
  return (
    <div
      className={`flex min-h-[96px] flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`.trim()}
      aria-hidden
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`h-8 w-8 shrink-0 rounded-lg ${pulse}`} />
        <SkeletonLine width="2.5rem" height="0.65rem" className="ml-auto" />
      </div>
      <div className="space-y-1.5">
        <div className={`h-6 w-24 max-w-full rounded sm:w-32 ${pulse}`} />
        <div className={`h-3 w-16 max-w-full rounded sm:w-20 ${pulse}`} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = "" }) {
  return (
    <ul className={`space-y-4 ${className}`.trim()} aria-hidden>
      {[...Array(count)].map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <div className={`h-11 w-11 shrink-0 rounded-full ${pulse}`} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className={`h-3.5 w-full max-w-xs rounded ${pulse}`} />
            <div className={`h-3 w-2/3 max-w-[200px] rounded ${pulse}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SkeletonDonutPlaceholder({ className = "" }) {
  return (
    <div
      className={`flex h-52 w-full items-center justify-center sm:h-64 ${className}`.trim()}
      aria-hidden
    >
      <div className={`h-40 w-40 rounded-full ${pulse}`} />
    </div>
  );
}

export function SkeletonChartBlock({ className = "" }) {
  return (
    <div
      className={`flex h-52 w-full flex-col justify-end rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:h-64 ${className}`.trim()}
      aria-hidden
    >
      <SkeletonLine width="45%" height="0.7rem" className="mb-4" />
      <div className={`mt-auto h-32 w-full rounded-lg ${pulse}`} />
    </div>
  );
}

export function SkeletonCalendarGrid({ className = "" }) {
  return (
    <div className={`space-y-3 p-2 ${className}`.trim()} aria-hidden>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className={`h-3 rounded ${pulse}`} />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="aspect-square rounded-md border border-gray-100 p-0.5">
            <div className={`h-2 w-4 rounded ${pulse} mx-0.5 mt-0.5`} />
            <div className={`mt-1 h-6 w-full rounded ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
