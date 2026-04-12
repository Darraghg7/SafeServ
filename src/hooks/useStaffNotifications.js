import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'

/**
 * Computes staff-facing notifications scoped to a venue.
 * Shows the current staff member their own relevant updates.
 */
export function useStaffNotifications(staffId) {
  const { venueId } = useVenue()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!staffId || !venueId) { setLoading(false); return }
    let cancelled = false
    loadStaffNotifications(staffId, venueId)
      .then(items  => { if (!cancelled) setNotifications(items) })
      .catch(()    => { if (!cancelled) setNotifications([]) })
      .finally(()  => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [staffId, venueId])

  return { notifications, count: notifications.length, loading }
}

async function loadStaffNotifications(staffId, venueId) {
  const items = []
  const since = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  await Promise.all([
    checkMySwapUpdates(items, staffId, venueId, since),
    checkMyTimeOffUpdates(items, staffId, venueId, since),
    checkMyUpcomingShift(items, staffId, venueId),
  ])

  const sevOrder = { critical: 0, warning: 1, info: 2 }
  items.sort((a, b) => (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2))
  return items
}

async function checkMySwapUpdates(items, staffId, venueId, since) {
  const { data } = await supabase
    .from('shift_swaps')
    .select('id, status, updated_at')
    .eq('venue_id', venueId)
    .eq('requester_id', staffId)
    .in('status', ['approved', 'rejected'])
    .gte('updated_at', since + 'T00:00:00')
    .order('updated_at', { ascending: false })
    .limit(10)

  for (const swap of (data ?? [])) {
    items.push({
      id: `swap-${swap.id}`,
      type: swap.status === 'approved' ? 'swap_approved' : 'swap_rejected',
      message: `Your shift swap request was ${swap.status}`,
      link: '/rota',
      severity: swap.status === 'approved' ? 'info' : 'warning',
    })
  }
}

async function checkMyTimeOffUpdates(items, staffId, venueId, since) {
  const { data } = await supabase
    .from('time_off_requests')
    .select('id, status, start_date, end_date, updated_at')
    .eq('venue_id', venueId)
    .eq('staff_id', staffId)
    .in('status', ['approved', 'rejected'])
    .gte('updated_at', since + 'T00:00:00')
    .order('updated_at', { ascending: false })
    .limit(10)

  for (const req of (data ?? [])) {
    const dateRange = req.start_date === req.end_date
      ? req.start_date
      : `${req.start_date} – ${req.end_date}`
    items.push({
      id: `timeoff-${req.id}`,
      type: req.status === 'approved' ? 'time_off_approved' : 'time_off_rejected',
      message: `Time off ${dateRange}: ${req.status}`,
      link: '/time-off',
      severity: req.status === 'approved' ? 'info' : 'warning',
    })
  }
}

async function checkMyUpcomingShift(items, staffId, venueId) {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')

  const { data } = await supabase
    .from('shifts')
    .select('id, shift_date, start_time, end_time')
    .eq('venue_id', venueId)
    .eq('staff_id', staffId)
    .eq('shift_date', today)
    .order('start_time')
    .limit(5)

  for (const shift of (data ?? [])) {
    const shiftStart = new Date(`${shift.shift_date}T${shift.start_time}`)
    const minsUntil = (shiftStart - now) / 60000
    // Only show if shift is within the next 2 hours and hasn't started yet
    if (minsUntil > 0 && minsUntil <= 120) {
      items.push({
        id: `shift-${shift.id}`,
        type: 'upcoming_shift',
        message: `Shift starting at ${shift.start_time.slice(0, 5)} today`,
        link: '/clock',
        severity: 'info',
      })
    }
  }
}
