import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/VenueContext'

export default function useVenueSettings() {
  const { venueId } = useVenue()
  const [settings, setSettings] = useState({ venue_name: '', manager_email: '', logo_url: '' })
  const [loading, setLoading]   = useState(true)
  const load = async () => {
    if (!venueId) { setLoading(false); return }
    const { data } = await supabase.from('app_settings').select('*').eq('venue_id', venueId)
    if (data) {
      const map = Object.fromEntries(data.map(r => [r.key, r.value]))
      setSettings({
        venue_name:    map.venue_name    ?? '',
        manager_email: map.manager_email ?? '',
        logo_url:      map.logo_url      ?? '',
      })
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [venueId])
  return { settings, loading, reload: load }
}
