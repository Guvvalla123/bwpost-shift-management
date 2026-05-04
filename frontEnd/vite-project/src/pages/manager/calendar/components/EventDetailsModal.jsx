import React from 'react'
import {
  X,
  Clock,
  UserCheck,
  StickyNote,
  MapPin,
  AlignLeft,
  Users,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  Plus,
} from 'lucide-react'
import { fmtCalendarDate, fmtCalendarTime } from '../calendarFormat'

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  onSyncShift,
  syncing = false,
}) {
  if (!isOpen || !event) return null

  const p = event.extendedProps || {}
  const source = p.source === 'google' ? 'google' : 'app'
  const startStr = event.startStr ?? event.start
  const endStr = event.endStr ?? event.end

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] md:items-center md:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[60vh] w-full max-w-full overflow-hidden overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom duration-200 md:max-h-[90vh] md:max-w-sm md:rounded-2xl md:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div
          className={`h-1 w-full md:h-2 ${source === 'google' ? 'bg-sky-500' : 'bg-[#1B3F8B]'}`}
        />

        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900 leading-tight pr-4">
            {event.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-700">
              <p>{fmtCalendarDate(startStr)}</p>
              {!event.allDay && (
                <p className="text-gray-500 text-xs mt-0.5">
                  {fmtCalendarTime(startStr)} — {fmtCalendarTime(endStr)}
                </p>
              )}
            </div>
          </div>

          {source === 'app' ? (
            <>
              <div className="flex items-start gap-3">
                <UserCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">
                  {p.accepted ?? 0} assigned · {p.slots ?? 0} slots remaining
                </p>
              </div>
              {p.notes ? (
                <div className="flex items-start gap-3">
                  <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-6">
                    {p.notes}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {source === 'google' ? (
            <>
              {p.location ? (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700">{p.location}</p>
                </div>
              ) : null}
              {p.description ? (
                <div className="flex items-start gap-3">
                  <AlignLeft className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-6">
                    {p.description}
                  </p>
                </div>
              ) : null}
              {p.attendees?.length > 0 ? (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {p.attendees.length} guests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.attendees.slice(0, 4).map((a, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          {a.displayName || a.email}
                        </span>
                      ))}
                      {p.attendees.length > 4 ? (
                        <span className="text-xs text-gray-400">
                          +{p.attendees.length - 4} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
              {p.htmlLink ? (
                <a
                  href={p.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline mt-2 pt-3 border-t border-gray-100"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Calendar
                </a>
              ) : null}
            </>
          ) : null}

          {typeof onSyncShift === 'function' && source === 'app' ? (
            <button
              type="button"
              onClick={() => onSyncShift(p.shiftId)}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 mt-2 pt-3 border-t border-gray-100 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {syncing ? 'Syncing…' : 'Sync to Google Calendar'}
            </button>
          ) : null}

          {source === 'app' && (onEdit || onDelete) ? (
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(event)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
