'use client'
import { useQuery } from '@tanstack/react-query'

export function useTransactions(address: string | undefined) {
  return useQuery({
    queryKey: ['transactions', address],
    queryFn: async () => {
      if (!address) return []
      const res = await fetch(`/api/transactions?address=${address}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
    enabled: !!address,
  })
}
