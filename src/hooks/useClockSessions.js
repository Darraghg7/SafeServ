/**
 * useClockSessions — fetches the last 7 days of clock events for a staff
 * member and groups them into completed / active sessions for display and
 * editing.
 *
 * Each session:
 *   { clockInId, clockInAt, clockOutId, clockOutAt, breakMinutes, date }
 *
 * breakMinutes is rounded to nearest whole minute from the actual break
 * events, ready to pre-fill the edit form.
 */
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'
import { subDays, startOfDay } from 'date-fns'

export function useClockSessions(staffId) {
  const { venueId } = useVenue()
  const [sessions, setSessions]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const load = useCallback(async () => {
    if (!staffId) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const since = startOfDay(subDays(new Date(), 7)).toISOString()

    let q = supabase
      .from('clock_events')
      .select('id, event_type, occurred_at')
      .eq('staff_id', staffId)
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: true })
    if (venueId) q = q.eq('venue_id', venueId)

    const { data, error: err } = await q
    if (err) { setError(err.message); setLoading(false); return }

    // Group events into sessions.
    // A new session starts at each clock_in event.
    const result = []
    let current = null

    for (const ev of data ?? []) {
      if (ev.event_type === 'clock_in') {
        // Start a new session
        current = {
          clockInId:    ev.id,
          clockInAt:    new Date(ev.occurred_at),
          clockOutId:   null,
          clockOutAt:   null,
          breakMinutes: 0,
          date:         new Date(ev.occurred_at),
          // internal accumulators
          _breaks: [],
          _lastBreakStart: null,
        }
        result.push(current)
      } else if (current) {
        if (ev.event_type === 'clock_out') {
          current.clockOutId  = ev.id
          current.clockOutAt  = new Date(ev.occurred_at)
          current = null  // session closed
        } else if (ev.event_type === 'break_start') {
          current._lastBreakStart = new Date(ev.occurred_at)
        } else if (ev.event_type === 'break_end' && current._lastBreakStart) {
          const ms = new Date(ev.occurred_at) - current._lastBreakStart
          current._breaks.push(ms)
          current._lastBreakStart = null
        }
      }
    }

    // Calculate breakMinutes for each session and clean up internal fields
    const clean = result.map(({ _breaks, _lastBreakStart, ...s }) => ({
      ...s,
      breakMinutes: Math.round(_breaks.reduce((a, b) => a + b, 0) / 60000),
    }))

    // Most-recent first
    setSessions(clean.reverse())
    setLoading(false)
  }, [staffId, venueId])

  useEffect(() => { load() }, [load])

  return { sessions, loading, error, reload: load }
}
