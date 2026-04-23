/**
 * Centered empty state with optional primary and secondary actions.
 * Legacy: `message` and `action={{ label, onClick }}` remain supported.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  action,
  className = "",
  iconWrapperClassName = "bg-[#1B3F8B]/10",
}) {
  const desc = description ?? message;
  const legacy = action && typeof action === "object" && action.onClick;
  const primaryLabel = actionLabel ?? (legacy ? action.label : null);
  const primaryClick = onAction ?? (legacy ? action.onClick : null);

  return (
    <div
      className={`flex min-h-0 flex-col items-center justify-center py-16 text-center sm:px-4 ${className}`.trim()}
      role="status"
    >
      {Icon && (
        <div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconWrapperClassName}`.trim()}
        >
          <Icon className="h-8 w-8 text-[#1B3F8B]" strokeWidth={1.75} aria-hidden />
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {desc && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{desc}</p>
      )}

      {(primaryLabel && primaryClick) || (secondaryLabel && onSecondaryAction) ? (
        <div className="mt-6 flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:justify-center">
          {primaryLabel && primaryClick ? (
            <button
              type="button"
              onClick={primaryClick}
              className="inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-xl bg-[#1B3F8B] px-6 text-sm font-semibold text-white transition hover:bg-[#152f6b] sm:w-auto"
            >
              {primaryLabel}
            </button>
          ) : null}
          {secondaryLabel && onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 sm:w-auto"
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
