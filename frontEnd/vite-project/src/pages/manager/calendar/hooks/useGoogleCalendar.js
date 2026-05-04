import { useState, useEffect, useCallback } from 'react'
import { useGoogleLogin, googleLogout } from '@react-oauth/google'
import { toast } from 'sonner'

const GC_API = 'https://www.googleapis.com/calendar/v3'

export async function fetchGoogleEvents(accessToken) {
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(now.getMonth() - 1)
  const threeMonthsAhead = new Date(now)
  threeMonthsAhead.setMonth(now.getMonth() + 3)

  const res = await fetch(
    `${GC_API}/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: oneMonthAgo.toISOString(),
        timeMax: threeMonthsAhead.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '500',
      }),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) throw new Error('Failed to fetch Google Calendar events')
  const data = await res.json()
  return data.items || []
}

export async function createGoogleCalendarEvent(accessToken, event) {
  const res = await fetch(`${GC_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export function mapGoogleEventToFc(ev) {
  return {
    id: ev.id,
    title: ev.summary || '(No title)',
    start: ev.start?.dateTime || ev.start?.date,
    end: ev.end?.dateTime || ev.end?.date,
    allDay: !ev.start?.dateTime,
    backgroundColor: '#0ea5e9',
    borderColor: 'transparent',
    extendedProps: {
      source: 'google',
      description: ev.description || '',
      location: ev.location || '',
      attendees: ev.attendees || [],
      htmlLink: ev.htmlLink,
      status: ev.status,
    },
  }
}

export function useGoogleCalendar() {
  const [token, setToken] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [googleFcEvents, setGoogleFcEvents] = useState([])
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [syncingShiftId, setSyncingShiftId] = useState(null)

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar',
    onSuccess: async (codeResponse) => {
      setToken(codeResponse.access_token)
      try {
        const info = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${codeResponse.access_token}` },
          },
        ).then((r) => r.json())
        setUserInfo(info)
      } catch {
        /* profile optional */
      }
    },
    onError: () => toast.error('Google sign-in failed'),
  })

  const logout = useCallback(() => {
    googleLogout()
    setToken(null)
    setUserInfo(null)
    setGoogleFcEvents([])
    toast.success('Signed out from Google')
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoadingGoogle(true)
    fetchGoogleEvents(token)
      .then((items) => {
        if (!cancelled) setGoogleFcEvents(items.map(mapGoogleEventToFc))
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load Google Calendar events')
      })
      .finally(() => {
        if (!cancelled) setLoadingGoogle(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const refreshGoogleEvents = useCallback(async () => {
    if (!token) return
    setLoadingGoogle(true)
    try {
      const items = await fetchGoogleEvents(token)
      setGoogleFcEvents(items.map(mapGoogleEventToFc))
      toast.success('Calendar refreshed')
    } catch {
      toast.error('Failed to refresh')
    } finally {
      setLoadingGoogle(false)
    }
  }, [token])

  const syncShiftToGoogle = useCallback(
    async (shiftId, appShifts) => {
      const shift = appShifts.find((s) => s._id === shiftId)
      if (!shift) return
      if (!token) return toast.error('Please sign in with Google first')
      setSyncingShiftId(shiftId)
      try {
        await createGoogleCalendarEvent(token, {
          summary: shift.shiftTitle,
          description:
            shift.shiftNotes ||
            `Shift: ${shift.shiftTitle}\nSlots: ${shift.slotsAvailable}`,
          start: {
            dateTime: shift.shiftStartTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: shift.shiftEndTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          colorId: '7',
        })
        toast.success(`"${shift.shiftTitle}" synced to Google Calendar`)
        const updated = await fetchGoogleEvents(token)
        setGoogleFcEvents(updated.map(mapGoogleEventToFc))
      } catch {
        toast.error('Failed to sync shift')
      } finally {
        setSyncingShiftId(null)
      }
    },
    [token],
  )

  return {
    token,
    userInfo,
    isAuthorized: !!token,
    login,
    logout,
    googleFcEvents,
    loadingGoogle,
    refreshGoogleEvents,
    syncShiftToGoogle,
    syncingShiftId,
  }
}
