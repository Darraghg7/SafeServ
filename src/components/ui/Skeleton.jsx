import React from 'react'

/**
 * Shimmer loading placeholder.
 * Variants: 'text' (single line), 'card' (rectangle), 'circle' (avatar).
 */
export default function Skeleton({ variant = 'text', className = '', width, height }) {
  const base = 'animate-pulse bg-charcoal/[0.06] dark:bg-white/[0.06] rounded'

  if (variant === 'circle') {
    return (
      <div
        className={`${base} rounded-full shrink-0 ${className}`}
        style={{ width: width ?? 40, height: height ?? 40 }}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`${base} rounded-xl ${className}`}
        style={{ width: width ?? '100%', height: height ?? 120 }}
      />
    )
  }

  // text
  return (
    <div
      className={`${base} rounded-md ${className}`}
      style={{ width: width ?? '100%', height: height ?? 14 }}
    />
  )
}

/** Full-page skeleton matching a typical dashboard layout. */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={220} height={28} />
          <Skeleton width={160} height={14} />
        </div>
        <Skeleton variant="card" width={120} height={40} className="rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="card" height={100} className="rounded-xl" />
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton variant="card" height={200} className="rounded-xl" />
        <Skeleton variant="card" height={200} className="rounded-xl" />
      </div>
    </div>
  )
}
