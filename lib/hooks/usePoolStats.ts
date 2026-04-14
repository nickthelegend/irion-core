'use client'
import { useQuery } from '@tanstack/react-query'

export function usePoolStats() {
  return useQuery({
    queryKey: ['pool-stats'],
    queryFn: async () => {
      // Add timestamp to foil any browser/proxy caches
      const res = await fetch(`/api/pool/stats?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch pool stats')
      return res.json() as Promise<{ total_deposits: number, total_borrowed: number, utilization_rate: number, apy: number }>
    },
    refetchInterval: 60_000, // refresh every minute
    staleTime: 0, // always consider data stale
    refetchOnMount: 'always', // always refetch on mount
    refetchOnWindowFocus: true, // refetch when window regains focus
  })
}
