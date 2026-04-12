import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'
import { format } from 'date-fns'

export const COOLING_TARGET_TEMP = 8  // ≤8°C required by UK food safety regs

export const COOLING_METHODS = [
  { value: 'ambient',       label: 'Ambient (room temp)' },
  { value: 'ice_bath',      label: 'Ice bath' },
  { value: 'blast_chiller', label: 'Blast chiller' },
  { value: 'cold_water',    label: 'Cold running water' },
  { value: 'other',         label: 'Other' },
]

/** Returns true if the end temperature is above the safe threshold */
export function isCoolingTempFail(endTemp, targetTemp = COOLING_TARGET_TEMP) {
  return Number(endTemp) > targetTemp
}

/** Filtered history hook — pass date strings 'yyyy-MM-dd' */
export function useCoolingLogs(dateFrom, dateTo) {
  const { venueId } = useVenue()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!venueId) return
    setLoading(true)
    let q = supabase
      .from('cooling_logs')
      .select('id, food_item, start_temp, end_temp, cooling_method, start_time, end_time, pass, corrective_action, logged_at, logged_by_name, venue_id')
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

/** Today's logs only — for dashboard / summary */
export function useTodayCoolingLogs() {
  const { venueId } = useVenue()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!venueId) return
    const today = format(new Date(), 'yyyy-MM-dd')
    supabase
      .from('cooling_logs')
      .select('id, food_item, start_temp, end_temp, cooling_method, start_time, end_time, pass, corrective_action, logged_at, logged_by_name, venue_id')
      .eq('venue_id', venueId)
      .gte('logged_at', today)
      .order('logged_at', { ascending: false })
      .then(({ data }) => { setLogs(data ?? []); setLoading(false) })
  }, [venueId])

  return { logs, loading }
}
