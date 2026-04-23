import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * `description` is preferred; `message` is supported for existing call sites.
 */
export default function ErrorState({
  title = "Something went wrong",
  description,
  message,
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  const detail = description ?? message;

  return (
    <div
      className={`flex min-h-0 flex-col items-center justify-center py-12 px-4 text-center sm:py-16 ${className}`.trim()}
      role="alert"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" strokeWidth={2} aria-hidden />
      </div>

      <h3 className="text-lg font-semibold text-red-600">{title}</h3>

      {detail && <p className="mt-2 max-w-sm text-sm text-gray-500">{detail}</p>}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-6 text-sm font-semibold text-white transition hover:bg-[#152f6b]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
