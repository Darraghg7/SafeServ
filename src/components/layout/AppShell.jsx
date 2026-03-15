import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../../contexts/SessionContext'
import { supabase } from '../../lib/supabase'
import NotificationBell from '../notifications/NotificationBell'

function useOverdueCleaning() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const load = async () => {
      const { data: tasks } = await supabase
        .from('cleaning_tasks').select('id, frequency').eq('is_active', true)
      if (!tasks?.length) return
      const { data: completions } = await supabase
        .from('cleaning_completions').select('cleaning_task_id, completed_at')
        .order('completed_at', { ascending: false })
      const freqDays = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30, quarterly: 90 }
      const now = new Date()
      let overdue = 0
      for (const t of tasks) {
        const last = completions?.find(c => c.cleaning_task_id === t.id)
        if (!last) { overdue++; continue }
        if ((now - new Date(last.completed_at)) / 86400000 > freqDays[t.frequency]) overdue++
      }
      setCount(overdue)
    }
    load()
  }, [])
  return count
}

function usePendingSwaps() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    supabase.from('shift_swaps').select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count: c }) => setCount(c ?? 0))
  }, [])
  return count
}

function useVenueLogo() {
  const [logoUrl, setLogoUrl] = useState('')
  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'logo_url').single()
      .then(({ data }) => { if (data?.value) setLogoUrl(data.value) })
  }, [])
  return logoUrl
}

export default function AppShell({ children }) {
  const { session, isManager, signOut } = useSession()
  const location     = useLocation()
  const navigate     = useNavigate()
  const overdueCount = useOverdueCleaning()
  const pendingSwaps = usePendingSwaps()
  const logoUrl      = useVenueLogo()
  const navRef       = useRef(null)
  const [canScrollLeft, setCanScrollLeft]   = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const name = session?.staffName ?? ''

  const handleSignOut = () => {
    signOut()
    navigate('/', { replace: true })
  }

  // ── Nav scroll state ───────────────────────────────────────────────────
  const updateScrollIndicators = () => {
    const el = navRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    updateScrollIndicators()
    el.addEventListener('scroll', updateScrollIndicators, { passive: true })
    window.addEventListener('resize', updateScrollIndicators)
    return () => {
      el.removeEventListener('scroll', updateScrollIndicators)
      window.removeEventListener('resize', updateScrollIndicators)
    }
  }, [])

  // Scroll active link into view on mount / route change
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const active = el.querySelector('[data-active="true"]')
    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    // Update indicators after scroll
    setTimeout(updateScrollIndicators, 100)
  }, [location.pathname])

  // ── Nav links ────────────────────────────────────────────────────────────
  const managerLinks = [
    { to: '/dashboard',       label: 'DASHBOARD' },
    { to: '/fridge',          label: 'TEMP LOGS' },
    { to: '/opening-closing', label: 'CHECKS' },
    { to: '/allergens',       label: 'ALLERGENS' },
    { to: '/cleaning',        label: overdueCount > 0 ? `CLEANING (${overdueCount})` : 'CLEANING', alert: overdueCount > 0 },
    { to: '/timesheet',       label: 'HOURS' },
    { to: '/rota',            label: pendingSwaps > 0 ? `ROTA (${pendingSwaps})` : 'ROTA', alert: pendingSwaps > 0 },
    { to: '/waste',           label: 'WASTE' },
    { to: '/orders',          label: 'ORDERS' },
    { to: '/training',        label: 'TRAINING' },
    { to: '/settings',        label: 'SETTINGS' },
  ]

  const staffLinks = [
    { to: '/dashboard',       label: 'MY SHIFT' },
    { to: '/opening-closing', label: 'CHECKS' },
    { to: '/cleaning',        label: 'CLEANING' },
    ...(session?.showTempLogs  ? [{ to: '/fridge',    label: 'TEMP LOGS' }] : []),
    ...(session?.showAllergens ? [{ to: '/allergens', label: 'ALLERGENS' }] : []),
    { to: '/rota',            label: 'ROTA' },
    { to: '/waste',           label: 'WASTE' },
    { to: '/orders',          label: 'ORDERS' },
  ]

  const links    = isManager ? managerLinks : staffLinks
  const bgClass  = isManager ? 'bg-cream'   : 'bg-staffbg'
  const maxW     = isManager ? 'max-w-[900px]' : 'max-w-[560px]'

  return (
    <div className={`min-h-dvh ${bgClass} font-sans flex flex-col`}>

      {/* Header */}
      <header className="bg-charcoal shrink-0">
        <div className={`${maxW} mx-auto px-3 sm:px-8 h-12 flex items-center justify-between gap-1.5`}>
          {/* Left: logo */}
          <span className="font-serif text-cream text-lg tracking-tight shrink-0">SafeServ</span>
          {/* Right: bell + name + sign out + logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <NotificationBell />
            <span className="hidden sm:block text-xs text-cream/60 font-medium max-w-[120px] truncate">{name}</span>
            <button
              onClick={handleSignOut}
              className="text-[10px] sm:text-[11px] tracking-wider sm:tracking-widest uppercase text-cream/50 border border-cream/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:text-cream hover:border-cream/50 transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Venue logo"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md object-contain bg-white/10 p-0.5 shrink-0"
              />
            )}
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="bg-white border-b border-charcoal/10 shrink-0 relative">
        {/* Left fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        )}
        <div
          ref={navRef}
          className={`${maxW} mx-auto px-3 sm:px-8 flex overflow-x-auto scrollbar-hide`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {links.map(l => {
            const isActive = location.pathname === l.to || (l.to !== '/dashboard' && location.pathname.startsWith(l.to))
            return (
              <NavLink
                key={l.to} to={l.to}
                data-active={isActive}
                className={[
                  'px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] sm:text-[11px] tracking-widest font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px',
                  isActive
                    ? 'text-charcoal border-accent'
                    : l.alert
                      ? 'text-warning border-transparent hover:text-warning/80'
                      : 'text-charcoal/35 border-transparent hover:text-charcoal/60',
                ].join(' ')}
              >
                {l.label}
              </NavLink>
            )
          })}
        </div>
        {/* Right fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        )}
      </nav>

      {/* Page content */}
      <main className={`flex-1 ${maxW} mx-auto w-full px-4 sm:px-8 py-6 sm:py-8`}>
        {children}
      </main>
    </div>
  )
}
