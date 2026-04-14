import { useQuery } from '@tanstack/react-query'
import { fetchAssetBalance } from '@/lib/algorand/readChain'

export function useAssetBalance(address: string | undefined, assetId: number) {
  return useQuery({
    queryKey: ['asset-balance', address, assetId],
    queryFn: () => address ? fetchAssetBalance(address, assetId) : 0,
    enabled: !!address,
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}
