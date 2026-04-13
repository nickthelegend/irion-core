'use client'
import { useQuery } from '@tanstack/react-query'

export function usePoolStats() {
  return useQuery({
    queryKey: ['pool-stats'],
    queryFn: async () => {
      const res = await fetch('/api/pool/stats')
      if (!res.ok) throw new Error('Failed to fetch pool stats')
      return res.json() as Promise<{ total_deposits: number, total_borrowed: number, utilization_rate: number, apy: number }>
    },
    refetchInterval: 60_000, // refresh every minute
  })
}
