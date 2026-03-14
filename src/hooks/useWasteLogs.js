import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useWasteLogs(dateFrom, dateTo) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('waste_logs')
      .select('*')
      .order('recorded_at', { ascending: false })

    if (dateFrom) q = q.gte('recorded_at', dateFrom)
    if (dateTo)   q = q.lte('recorded_at', dateTo + 'T23:59:59')

    const { data } = await q
    setLogs(data ?? [])
    setLoading(false)
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  return { logs, loading, reload: load }
}
