'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUserProfile(address: string | undefined) {
  return useQuery({
    queryKey: ['user', address],
    queryFn: async () => {
      if (!address) return null
      const res = await fetch(`/api/user/${address}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch user profile')
      return res.json()
    },
    enabled: !!address,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export function useSyncUserProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (address: string) => {
      const res = await fetch(`/api/user/${address}/sync`, { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      return res.json()
    },
    onSuccess: async (_, address) => {
      await qc.refetchQueries({ queryKey: ['user', address], type: 'active' })
    },
  })
}
