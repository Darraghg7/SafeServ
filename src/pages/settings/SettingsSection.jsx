import React, { useState } from 'react'

export default function SettingsSection({ title, subtitle, children, defaultOpen = false, locked = false }) {
  const [open, setOpen] = useState(defaultOpen && !locked)
  return (
    <div className="bg-white dark:bg-white/5 rounded-xl border border-charcoal/10 dark:border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => !locked && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${locked ? 'cursor-default opacity-60' : 'hover:bg-charcoal/[0.02] dark:hover:bg-white/[0.02]'}`}
      >
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-white/35">{title}</p>
            {locked && (
              <span className="text-[9px] tracking-widest uppercase font-semibold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">Pro</span>
            )}
          </div>
          {subtitle && <p className="text-xs text-charcoal/30 dark:text-white/25 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {locked ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal/20 shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        ) : (
          <span
            className="text-charcoal/25 dark:text-white/20 text-sm shrink-0 inline-block transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >▾</span>
        )}
      </button>
      {open && !locked && (
        <div className="px-6 pb-6 pt-5 border-t border-charcoal/8 dark:border-white/8">
          {children}
        </div>
      )}
    </div>
  )
}
