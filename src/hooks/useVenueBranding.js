import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Module-level cache so repeated mounts don't re-fetch within the same session.
const _cache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function isFresh(venueId) {
  const ts = _cache[venueId + '_ts']
  return ts && Date.now() - ts < CACHE_TTL
}

/**
 * Returns { venueName, logoUrl } for the given venueId.
 * Fetches from app_settings once and caches for 5 minutes.
 * Safe to call from multiple components — only one DB request fires.
 */
export function useVenueBranding(venueId) {
  const cached = _cache[venueId]
  const [branding, setBranding] = useState(cached ?? { venueName: '', logoUrl: '' })

  useEffect(() => {
    if (!venueId) return
    if (isFresh(venueId)) {
      setBranding(_cache[venueId])
      return
    }
    let cancelled = false
    supabase
      .from('app_settings')
      .select('key, value')
      .eq('venue_id', venueId)
      .in('key', ['venue_name', 'logo_url'])
      .then(({ data }) => {
        if (cancelled || !data) return
        const map = Object.fromEntries(data.map(r => [r.key, r.value]))
        const result = {
          venueName: map.venue_name ?? '',
          logoUrl:   map.logo_url   ?? '',
        }
        _cache[venueId]          = result
        _cache[venueId + '_ts']  = Date.now()
        setBranding(result)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [venueId])

  return branding
}
