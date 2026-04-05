import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function useDeliveryChecks(venueId) {
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    if (!venueId) return
    setLoading(true)
    const { data } = await supabase
      .from('delivery_checks')
      .select('*, checker:staff!checked_by(name), supplier:suppliers(name)')
      .eq('venue_id', venueId)
      .order('checked_at', { ascending: false })
      .limit(100)
    setChecks(data ?? [])
    setLoading(false)
  }, [venueId])
  useEffect(() => { load() }, [load])
  return { checks, loading, reload: load }
}
