export default function EmptyState({ icon: Icon, title, message, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center ${className}`.trim()}
      role="status"
    >
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-400" aria-hidden />
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>

      {message && (
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">{message}</p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="w-full sm:w-auto h-11 px-6 text-sm font-semibold rounded-xl bg-[#1B3F8B] text-white hover:bg-[#152f6b] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
