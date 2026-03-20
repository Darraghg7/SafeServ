import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'

export const PEST_LOG_TYPES = [
  { value: 'inspection', label: 'Routine Inspection' },
  { value: 'sighting',   label: 'Pest Sighting' },
  { value: 'treatment',  label: 'Treatment' },
  { value: 'follow_up',  label: 'Follow-up' },
]

export const PEST_TYPES = [
  { value: 'rodent',     label: 'Rodent' },
  { value: 'cockroach',  label: 'Cockroach' },
  { value: 'fly',        label: 'Fly / Flying insect' },
  { value: 'ant',        label: 'Ant' },
  { value: 'bird',       label: 'Bird' },
  { value: 'other',      label: 'Other' },
]

export const PEST_SEVERITIES = [
  { value: 'low',    label: 'Low',    color: 'text-success' },
  { value: 'medium', label: 'Medium', color: 'text-warning' },
  { value: 'high',   label: 'High',   color: 'text-danger' },
]

/** Filtered history hook — pass date strings 'yyyy-MM-dd' */
export function usePestControlLogs(dateFrom, dateTo) {
  const { venueId } = useVenue()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!venueId) return
    setLoading(true)
    let q = supabase
      .from('pest_control_logs')
      .select('*')
      .eq('venue_id', venueId)
      .order('logged_at', { ascending: false })
      .limit(200)

    if (dateFrom) q = q.gte('logged_at', dateFrom)
    if (dateTo)   q = q.lte('logged_at', dateTo + 'T23:59:59')

    const { data } = await q
    setLogs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [venueId, dateFrom, dateTo])

  return { logs, loading, reload: load }
}

/** Returns open issues only — for dashboard / compliance */
export function useOpenPestIssues() {
  const { venueId } = useVenue()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!venueId) return
    supabase
      .from('pest_control_logs')
      .select('*')
      .eq('venue_id', venueId)
      .eq('status', 'open')
      .in('log_type', ['sighting', 'treatment'])
      .order('logged_at', { ascending: false })
      .then(({ data }) => { setIssues(data ?? []); setLoading(false) })
  }, [venueId])

  return { issues, loading }
}
