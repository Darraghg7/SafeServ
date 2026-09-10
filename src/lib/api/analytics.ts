import { supabase } from '../supabase'

export interface StaffLastLoginRow {
  staff_id: string
  staff_name: string
  role: string
  last_login: string | null
}

/** Settings → Analytics: last login per staff member, venue-scoped. */
export async function fetchStaffLastLogins(sessionToken: string) {
  const { data, error } = await supabase.rpc('list_staff_last_logins', { p_session_token: sessionToken })
  return { data: (data ?? []) as StaffLastLoginRow[], error }
}
