import React from 'react'
import { Link } from 'react-router-dom'
import { useVenue } from '../../contexts/VenueContext'

export function WidgetShell({ title, to, children, status }) {
  const { venueSlug } = useVenue()
  const statusBorder = {
    good: 'border-l-success',
    warning: 'border-l-warning',
    bad: 'border-l-danger',
  }
  const href = to && venueSlug ? `/v/${venueSlug}${to}` : to
  return (
    <div className={`bg-white rounded-xl overflow-hidden ${status ? `border-l-4 ${statusBorder[status] ?? ''}` : ''}`}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="text-[11px] tracking-widest uppercase text-charcoal/40 font-medium">{title}</p>
        {href && (
          <Link to={href} className="text-[11px] tracking-widest uppercase text-charcoal/25 hover:text-charcoal/50 transition-colors">
            View →
          </Link>
        )}
      </div>
      <div className="px-5 pb-4">{children}</div>
    </div>
  )
}

export function BigNumber({ value, label, alert }) {
  return (
    <div className="text-center py-1">
      <p className={`font-serif text-3xl font-bold ${alert ? 'text-danger' : 'text-charcoal'}`}>{value}</p>
      {label && <p className="text-xs text-charcoal/40 mt-0.5">{label}</p>}
    </div>
  )
}

export function MiniRow({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-charcoal/60">{label}</span>
      <span className={`text-sm font-semibold ${warn ? 'text-danger' : 'text-charcoal'}`}>{value}</span>
    </div>
  )
}
