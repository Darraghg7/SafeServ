import { useQuery } from '@tanstack/react-query'
import { useSession } from '../contexts/SessionContext'
import { fetchStaffLastLogins } from '../lib/api/analytics'

export default function useStaffLastLogins() {
  const { session } = useSession()
  const token = session?.token

  const { data, isLoading } = useQuery({
    queryKey: ['staff-last-logins', session?.venueId],
    queryFn: () => fetchStaffLastLogins(token!),
    enabled: !!token,
    staleTime: 60_000,
  })

  return { rows: data?.data ?? [], error: data?.error, loading: isLoading }
}
