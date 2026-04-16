import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'

const FREQ_DAYS = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30, quarterly: 90 }

// Compare two dates by calendar day in the local timezone.
// Returns the integer number of calendar days between them (b - a).
function calendarDaysBetween(a, b) {
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((bDay - aDay) / 86400000)
}

export function cleaningStatus(task, lastCompletion) {
  if (!lastCompletion) return 'overdue'
  const completedAt = new Date(lastCompletion.completed_at)
  const now = new Date()

  // Daily tasks: once marked done today, they stay 'done' for the rest of the
  // calendar day. Tomorrow they're 'overdue' (a fresh day that needs doing).
  if (task.frequency === 'daily' || !FREQ_DAYS[task.frequency]) {
    const daysAgo = calendarDaysBetween(completedAt, now)
    if (daysAgo <= 0) return 'done'
    return 'overdue'
  }

  // Multi-day frequencies: 'done' until 80% of the window elapses,
  // 'due_soon' until the window expires, then 'overdue'.
  const daysSince = (now - completedAt) / 86400000
  const threshold = FREQ_DAYS[task.frequency]
  if (daysSince <= threshold * 0.8) return 'done'
  if (daysSince <= threshold)       return 'due_soon'
  return 'overdue'
}

export function useCleaningTasks(jobRole = null) {
  const { venueId } = useVenue()
  const [tasks, setTasks]             = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    if (!venueId) { setLoading(false); return }
    setLoading(true)
    const [{ data: tData }, { data: cData }] = await Promise.all([
      supabase.from('cleaning_tasks').select('id, title, frequency, assigned_role, is_active, venue_id').eq('venue_id', venueId).eq('is_active', true).order('title'),
      supabase
        .from('cleaning_completions')
        .select('id, cleaning_task_id, completed_at, completed_by_staff_id, completed_by_name, venue_id')
        .eq('venue_id', venueId)
        .order('completed_at', { ascending: false })
        .limit(1000),
    ])

    let filtered = tData ?? []
    if (jobRole) {
      filtered = filtered.filter((t) => t.assigned_role === jobRole || t.assigned_role === 'all')
    }

    setTasks(filtered)
    setCompletions(cData ?? [])
    setLoading(false)
  }, [venueId, jobRole])

  useEffect(() => { load() }, [load])

  // Enrich tasks with status + last completion
  const enriched = tasks.map((t) => {
    const last = completions.find((c) => c.cleaning_task_id === t.id) ?? null
    return { ...t, lastCompletion: last, status: cleaningStatus(t, last) }
  })

  const overdueCount = enriched.filter((t) => t.status === 'overdue').length

  return { tasks: enriched, loading, reload: load, overdueCount }
}
