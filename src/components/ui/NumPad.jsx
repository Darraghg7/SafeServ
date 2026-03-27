import React from 'react'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '±', '0', '⌫']

export default function NumPad({ value, onChange }) {
  const handle = (key) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
      return
    }
    if (key === '±') {
      onChange(value.startsWith('-') ? value.slice(1) : '-' + (value || '0'))
      return
    }
    if (key === '.' && value.includes('.')) return
    // Max 1 decimal place
    if (value.includes('.') && (value.split('.')[1]?.length ?? 0) >= 1) return
    // No leading zeros unless "0."
    if ((value === '0' || value === '-0') && key !== '.') {
      onChange(value.replace('0', key))
      return
    }
    onChange(value + key)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map(k => (
        <button
          key={k}
          type="button"
          onPointerDown={(e) => { e.preventDefault(); handle(k) }}
          className={[
            'h-14 rounded-2xl text-lg font-semibold transition-all select-none',
            'active:scale-95',
            k === '⌫' || k === '±'
              ? 'bg-charcoal/8 text-charcoal/50 active:bg-charcoal/15'
              : 'bg-charcoal/6 text-charcoal active:bg-charcoal/15',
          ].join(' ')}
        >
          {k}
        </button>
      ))}
    </div>
  )
}
