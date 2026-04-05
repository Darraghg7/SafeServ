import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'

export default function useVenueClosures() {
  const { venueId } = useVenue()
  const [closures, setClosures] = useState([])
  const [loading, setLoading]   = useState(true)
  const load = useCallback(async () => {
    if (!venueId) { setLoading(false); return }
    const { data } = await supabase
      .from('venue_closures')
      .select('*')
      .eq('venue_id', venueId)
      .order('start_date')
    setClosures(data ?? [])
    setLoading(false)
  }, [venueId])
  useEffect(() => { load() }, [load])
  return { closures, loading, reload: load }
}
