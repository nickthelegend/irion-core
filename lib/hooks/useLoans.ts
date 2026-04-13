'use client'
import { useQuery } from '@tanstack/react-query'

export function useLoans(address: string | undefined) {
  return useQuery({
    queryKey: ['loans', address],
    queryFn: async () => {
      if (!address) return []
      const res = await fetch(`/api/loans?borrower=${address}`)
      if (!res.ok) throw new Error('Failed to fetch loans')
      return res.json()
    },
    enabled: !!address,
  })
}

export function useLoan(loan_id: number | undefined) {
  return useQuery({
    queryKey: ['loan', loan_id],
    queryFn: async () => {
      const res = await fetch(`/api/loans/${loan_id}`)
      if (!res.ok) throw new Error('Failed to fetch loan')
      return res.json()
    },
    enabled: !!loan_id,
  })
}
