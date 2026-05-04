export function fmtCalendarDate(iso) {
  return iso
    ? new Date(iso).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : ''
}

export function fmtCalendarTime(iso) {
  return iso
    ? new Date(iso).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''
}
