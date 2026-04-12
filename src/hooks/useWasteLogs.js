import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'

export function useWasteLogs(dateFrom, dateTo) {
  const { venueId } = useVenue()
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!venueId) { setLoading(false); return }
    setLoading(true)
    let q = supabase
      .from('waste_logs')
      .select('id, item_name, category, weight_kg, reason, recorded_at, staff_name, venue_id')
      .eq('venue_id', venueId)
      .order('recorded_at', { ascending: false })
      .limit(500)

    if (dateFrom) q = q.gte('recorded_at', dateFrom)
    if (dateTo)   q = q.lte('recorded_at', dateTo + 'T23:59:59')

    const { data } = await q
    setLogs(data ?? [])
    setLoading(false)
  }, [venueId, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  return { logs, loading, reload: load }
}
