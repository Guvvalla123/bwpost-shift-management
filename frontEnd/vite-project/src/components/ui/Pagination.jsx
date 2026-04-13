import { ChevronLeft, ChevronRight } from "lucide-react";

function buildPageList(currentPage, totalPages) {
  if (totalPages <= 1) return [];
  const windowSize = 2;
  const pages = new Set([1, totalPages]);
  for (let i = currentPage - windowSize; i <= currentPage + windowSize; i += 1) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 20,
  onPageChange,
  isLoading = false,
}) {
  if (totalPages <= 1) return null;

  const disabled = isLoading;
  const start =
    totalItems === 0 ? 0 : Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const end =
    totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  const pageItems = buildPageList(currentPage, totalPages);
  const btnBase =
    "px-3 py-1.5 text-sm rounded-lg border transition-colors duration-150 inline-flex items-center justify-center min-w-[2.25rem]";
  const inactive =
    "bg-white text-slate-600 border-slate-200 hover:bg-[#EFF6FF] hover:border-[#BFDBFE]";
  const active = "bg-[#1B3F8B] text-white border-[#1B3F8B]";
  const navDisabled = disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "";

  return (
    <nav
      className="mt-4 px-1 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center"
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-400 order-2 sm:order-1" aria-live="polite">
        {totalItems === 0
          ? "Showing 0 of 0 items"
          : `Showing ${start}-${end} of ${totalItems} items`}
      </p>

      <div className="flex items-center justify-between gap-2 w-full sm:hidden order-1">
        <button
          type="button"
          className={`${btnBase} ${inactive} ${navDisabled} min-h-11 px-3`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>
        <span className="text-sm text-slate-600 tabular-nums shrink-0 px-1">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className={`${btnBase} ${inactive} ${navDisabled} min-h-11 px-3`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>

      <div className="hidden sm:flex flex-wrap items-center justify-center gap-1 order-1 sm:order-2">
        <button
          type="button"
          className={`${btnBase} ${inactive} ${navDisabled}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>

        {pageItems.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className="px-2 py-1.5 text-sm text-slate-400 select-none"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${btnBase} ${item === currentPage ? active : inactive} ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
              onClick={() => onPageChange(item)}
              disabled={disabled}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className={`${btnBase} ${inactive} ${navDisabled}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
