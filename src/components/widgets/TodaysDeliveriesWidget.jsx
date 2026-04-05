import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useVenue } from '../../contexts/VenueContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import { WidgetShell, MiniRow } from './shared'

function TodaysDeliveriesWidget() {
  const { venueId } = useVenue()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!venueId) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    supabase.from('delivery_checks')
      .select('id, supplier_name, overall_pass, checked_at')
      .eq('venue_id', venueId)
      .gte('checked_at', today.toISOString())
      .order('checked_at', { ascending: false })
      .limit(5)
      .then(({ data: checks }) => {
        const items = checks ?? []
        const fails = items.filter(c => !c.overall_pass).length
        setData({ total: items.length, fails, items })
      })
  }, [venueId])

  if (!data) return <WidgetShell title="Today's Deliveries" to="/deliveries"><div className="flex justify-center py-4"><LoadingSpinner /></div></WidgetShell>

  const status = data.fails > 0 ? 'bad' : data.total > 0 ? 'good' : 'neutral'

  return (
    <WidgetShell title="Today's Deliveries" to="/deliveries" status={status !== 'neutral' ? status : undefined}>
      {data.total === 0 ? (
        <p className="text-sm text-charcoal/30 italic py-2">No deliveries logged today</p>
      ) : (
        <>
          <MiniRow label="Deliveries" value={data.total} />
          <MiniRow label="Failed" value={data.fails} warn={data.fails > 0} />
          <div className="mt-2 border-t border-charcoal/6 pt-2">
            {data.items.map(c => (
              <div key={c.id} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-charcoal/60 truncate">{c.supplier_name}</span>
                <span className={`text-[11px] font-medium ${c.overall_pass ? 'text-success' : 'text-danger'}`}>
                  {c.overall_pass ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </WidgetShell>
  )
}

export default TodaysDeliveriesWidget
