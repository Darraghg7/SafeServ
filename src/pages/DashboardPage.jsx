/**
 * DashboardPage — thin role router.
 * Managers → ManagerDashboard (with onboarding redirect if needed)
 * Everyone else → StaffDashboardPage (My Shift view)
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../contexts/SessionContext'
import { useVenue } from '../contexts/VenueContext'
import StaffDashboardPage  from './dashboard/StaffDashboardPage'
import ManagerDashboardPage from './dashboard/ManagerDashboardPage'

export default function DashboardPage() {
  const { isManager } = useSession()
  const { venueId, venueSlug } = useVenue()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(!isManager)

  useEffect(() => {
    if (!isManager || !venueId) { setChecked(true); return }
    supabase
      .from('app_settings')
      .select('value')
      .eq('venue_id', venueId)
      .eq('key', 'onboarding_complete')
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.value) {
          navigate(`/v/${venueSlug}/setup`, { replace: true })
        } else {
          setChecked(true)
        }
      })
      .catch(() => setChecked(true))
  }, [isManager, venueId, venueSlug, navigate])

  if (!checked) return null
  return isManager ? <ManagerDashboardPage /> : <StaffDashboardPage />
}
