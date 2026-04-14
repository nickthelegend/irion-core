'use client'
import { useQuery } from '@tanstack/react-query'

export function useLoans(address: string | undefined) {
  return useQuery({
    queryKey: ['loans', address],
    queryFn: async () => {
      if (!address) return []
      const res = await fetch(`/api/loans?borrower=${address}&t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch loans')
      return res.json()
    },
    enabled: !!address,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export function useLoan(loan_id: number | undefined) {
  return useQuery({
    queryKey: ['loan', loan_id],
    queryFn: async () => {
      const res = await fetch(`/api/loans/${loan_id}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch loan')
      return res.json()
    },
    enabled: !!loan_id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}
