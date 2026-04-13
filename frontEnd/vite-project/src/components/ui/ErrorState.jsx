import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`.trim()}
      role="alert"
    >
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-500" aria-hidden />
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>

      {message && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{message}</p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" aria-hidden />
          Try Again
        </button>
      )}
    </div>
  );
}
