const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  if (totalPages <= 1) return null;

  const disabled = isLoading;

  return (
    <div
      className="
      flex items-center justify-between
      gap-2 px-4 py-3 border-t border-gray-100
    "
    >
      <button
        type="button"
        onClick={() =>
          onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className="
          h-10 px-4 text-sm font-medium
          rounded-lg border border-gray-300
          text-gray-700
          disabled:opacity-40
          disabled:cursor-not-allowed
          hover:bg-gray-50 transition-colors
          flex items-center gap-1.5
        "
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        <span className="
          text-sm text-gray-600 md:hidden
        ">
          {currentPage} / {totalPages}
        </span>

        <div className="hidden md:flex gap-1 flex-wrap justify-center max-w-[min(100%,28rem)]">
          {Array.from(
            { length: totalPages },
            (_, i) => i + 1
          ).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              disabled={disabled}
              className={`
                w-9 h-9 text-sm font-medium
                rounded-lg transition-colors ${
                page === currentPage
                  ? "bg-[#1B3F8B] text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className="
          h-10 px-4 text-sm font-medium
          rounded-lg border border-gray-300
          text-gray-700
          disabled:opacity-40
          disabled:cursor-not-allowed
          hover:bg-gray-50 transition-colors
          flex items-center gap-1.5
        "
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
