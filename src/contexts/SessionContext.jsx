/**
 * SessionContext — single auth source for all users (staff + managers).
 *
 * Everyone authenticates via PIN scoped to a venue. The `staffRole` field
 * determines what they can see: 'manager'/'owner' → manager dashboard,
 * 'staff' → My Shift staff view.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  SESSION_TOKEN_KEY,
  SESSION_ID_KEY,
  SESSION_NAME_KEY,
  SESSION_ROLE_KEY,
  SESSION_JOB_ROLE_KEY,
  SESSION_SHOW_TEMP_LOGS,
  SESSION_SHOW_ALLERGENS,
  SESSION_VENUE_ID_KEY,
  SESSION_VENUE_SLUG_KEY,
} from '../lib/constants'

const SessionContext = createContext(null)

/** Race a promise against a timeout — rejects if not resolved within ms. */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session validation timed out')), ms)
    ),
  ])
}

/** All localStorage keys we manage — centralised for easy clearSession(). */
const LS_KEYS = [
  SESSION_TOKEN_KEY,
  SESSION_ID_KEY,
  SESSION_NAME_KEY,
  SESSION_ROLE_KEY,
  SESSION_JOB_ROLE_KEY,
  SESSION_SHOW_TEMP_LOGS,
  SESSION_SHOW_ALLERGENS,
  SESSION_VENUE_ID_KEY,
  SESSION_VENUE_SLUG_KEY,
]

export function SessionProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)

  // ── Restore session from localStorage on mount ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY)
    const id    = localStorage.getItem(SESSION_ID_KEY)

    if (!token || !id) {
      setLoading(false)
      return
    }

    withTimeout(
      supabase.rpc('validate_staff_session', { p_token: token }),
      8000
    )
      .then(({ data: venueId, error }) => {
        // validate_staff_session returns venue_id (text) or null
        if (!error && venueId) {
          setSession({
            token,
            staffId:       id,
            staffName:     localStorage.getItem(SESSION_NAME_KEY)     ?? '',
            staffRole:     localStorage.getItem(SESSION_ROLE_KEY)     ?? 'staff',
            jobRole:       localStorage.getItem(SESSION_JOB_ROLE_KEY) ?? 'kitchen',
            showTempLogs:  localStorage.getItem(SESSION_SHOW_TEMP_LOGS) === 'true',
            showAllergens: localStorage.getItem(SESSION_SHOW_ALLERGENS) === 'true',
            venueId:       localStorage.getItem(SESSION_VENUE_ID_KEY) ?? venueId,
            venueSlug:     localStorage.getItem(SESSION_VENUE_SLUG_KEY) ?? '',
          })
        } else {
          // Token invalid or expired — clear so user is prompted to re-login
          clearStorage()
        }
        setLoading(false)
      })
      .catch(() => {
        // Network timeout or Supabase unavailable — clear stale token so the
        // user sees the login screen rather than being stuck on a spinner
        clearStorage()
        setLoading(false)
      })
  }, [])

  // ── Sign in ──────────────────────────────────────────────────────────────
  const signIn = useCallback(async (staffId, pin, venueId, venueSlug) => {
    const { data: token, error: tokenErr } = await supabase.rpc(
      'verify_staff_pin_and_create_session',
      { p_staff_id: staffId, p_pin: pin, p_venue_id: venueId }
    )
    if (tokenErr || !token) {
      return { error: tokenErr || new Error('Incorrect PIN') }
    }

    // Fetch full staff row
    const { data: row, error: rowErr } = await supabase
      .from('staff')
      .select('name, role, job_role, show_temp_logs, show_allergens')
      .eq('id', staffId)
      .single()

    if (rowErr) return { error: rowErr }

    const newSession = {
      token,
      staffId,
      staffName:    row.name       ?? '',
      staffRole:    row.role       ?? 'staff',
      jobRole:      row.job_role   ?? 'kitchen',
      showTempLogs: row.show_temp_logs  ?? false,
      showAllergens: row.show_allergens ?? false,
      venueId,
      venueSlug:    venueSlug ?? '',
    }

    // Persist to localStorage
    localStorage.setItem(SESSION_TOKEN_KEY,      token)
    localStorage.setItem(SESSION_ID_KEY,         staffId)
    localStorage.setItem(SESSION_NAME_KEY,       newSession.staffName)
    localStorage.setItem(SESSION_ROLE_KEY,       newSession.staffRole)
    localStorage.setItem(SESSION_JOB_ROLE_KEY,   newSession.jobRole)
    localStorage.setItem(SESSION_SHOW_TEMP_LOGS, String(newSession.showTempLogs))
    localStorage.setItem(SESSION_SHOW_ALLERGENS, String(newSession.showAllergens))
    localStorage.setItem(SESSION_VENUE_ID_KEY,   venueId)
    localStorage.setItem(SESSION_VENUE_SLUG_KEY, venueSlug ?? '')

    setSession(newSession)
    return { error: null }
  }, [])

  // ── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    const token = session?.token ?? localStorage.getItem(SESSION_TOKEN_KEY)
    clearStorage()
    setSession(null)
    if (token) {
      supabase.rpc('invalidate_staff_session', { p_token: token }).catch(() => {})
    }
  }, [session?.token])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clearStorage = () => LS_KEYS.forEach(k => localStorage.removeItem(k))

  const isManager = session?.staffRole === 'manager' || session?.staffRole === 'owner'

  const value = useMemo(() => ({
    session, loading, isManager, signIn, signOut
  }), [session, loading, isManager, signIn, signOut])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
