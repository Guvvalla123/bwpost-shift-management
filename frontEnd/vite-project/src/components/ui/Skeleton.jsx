export function SkeletonLine({ width = "100%", height = "1rem", className = "" }) {
  return (
    <div
      className={`rounded bg-slate-200 animate-pulse ${className}`.trim()}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonRow({ cols = 4, className = "" }) {
  return (
    <div className={`grid gap-4 py-2 ${className}`.trim()} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {[...Array(cols)].map((_, j) => (
        <div key={j} className="h-4 bg-slate-100 rounded animate-pulse" aria-hidden />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <div
        className="grid gap-4 pb-3 border-b border-slate-100"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded animate-pulse" aria-hidden />
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
      className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 ${className}`.trim()}
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
