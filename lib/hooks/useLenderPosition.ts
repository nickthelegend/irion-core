'use client'
import { useQuery } from '@tanstack/react-query'

export function useLenderPosition(address: string | undefined) {
  return useQuery({
    queryKey: ['lender-position', address],
    queryFn: async () => {
      if (!address) return { deposit_amount: 0, accrued_yield: 0 }
      const res = await fetch(`/api/pool/position/${address}`)
      if (!res.ok) throw new Error('Failed to fetch lender position')
      return res.json() as Promise<{ deposit_amount: number, accrued_yield: number }>
    },
    enabled: !!address,
  })
}
