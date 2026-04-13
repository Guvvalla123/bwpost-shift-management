export default function EmptyState({ icon: Icon, title, message, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`.trim()}
      role="status"
    >
      {Icon && (
        <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#1B3F8B]" aria-hidden />
        </div>
      )}

      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>

      {message && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{message}</p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 bg-[#1B3F8B] text-white text-sm font-bold rounded-lg hover:bg-[#162d5e] transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
