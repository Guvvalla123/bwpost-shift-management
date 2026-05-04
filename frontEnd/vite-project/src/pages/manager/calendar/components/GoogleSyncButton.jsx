import React from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

export default function GoogleSyncButton({
  onSync,
  syncing = false,
  isAuthorized,
  onAuthorize,
}) {
  if (!isAuthorized) {
    return (
      <button
        type="button"
        onClick={onAuthorize}
        className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
      >
        Connect Google Calendar
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSync}
      disabled={syncing}
      className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1B3F8B]/90 disabled:opacity-50"
    >
      {syncing ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {syncing ? 'Syncing…' : 'Sync with Google Calendar'}
    </button>
  )
}
