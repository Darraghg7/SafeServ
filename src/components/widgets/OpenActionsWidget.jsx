import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useVenue } from '../../contexts/VenueContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import { WidgetShell, BigNumber } from './shared'

function OpenActionsWidget() {
  const { venueId, venueSlug } = useVenue()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!venueId) return
    supabase.from('corrective_actions')
      .select('id, severity, status, title, reported_at')
      .eq('venue_id', venueId)
      .eq('status', 'open')
      .order('severity')
      .then(({ data: actions }) => {
        const items = actions ?? []
        const critical = items.filter(a => a.severity === 'critical').length
        const major = items.filter(a => a.severity === 'major').length
        setData({ total: items.length, critical, major, items })
      })
  }, [venueId])

  if (!data) return <WidgetShell title="Open Actions" to="/corrective"><div className="flex justify-center py-4"><LoadingSpinner /></div></WidgetShell>

  const status = data.critical > 0 ? 'bad' : data.total > 0 ? 'warning' : 'good'

  return (
    <WidgetShell title="Open Actions" to="/corrective" status={status}>
      <BigNumber value={data.total} label={data.total === 0 ? 'No open issues' : 'unresolved'} alert={data.critical > 0} />
      {data.total > 0 && (
        <div className="flex justify-center gap-3 mt-1">
          {data.critical > 0 && <span className="text-[11px] text-danger font-medium">{data.critical} critical</span>}
          {data.major > 0 && <span className="text-[11px] text-orange-600 font-medium">{data.major} major</span>}
        </div>
      )}
      {data.total > 0 && data.items.slice(0, 4).map(a => (
        <Link
          key={a.id}
          to={`/v/${venueSlug}/corrective`}
          className="flex items-center justify-between py-1.5 border-t border-charcoal/5 group"
        >
          <span className="text-xs text-charcoal/70 truncate flex-1 group-hover:text-charcoal transition-colors">{a.title ?? 'Untitled'}</span>
          <span className={`text-[11px] font-semibold shrink-0 ml-2 ${
            a.severity === 'critical' ? 'text-danger' :
            a.severity === 'major' ? 'text-warning' : 'text-charcoal/40'
          }`}>{a.severity?.toUpperCase()}</span>
        </Link>
      ))}
    </WidgetShell>
  )
}

export default OpenActionsWidget
