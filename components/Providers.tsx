'use client'

import { NetworkId, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react'
import { algorandChain } from 'algo-x-evm-sdk'
import { getDefaultConfig, createRainbowKitConfig } from '@txnlab/use-wallet-ui-react/rainbowkit'
import '@txnlab/use-wallet-ui-react/dist/style.css'
import '@rainbow-me/rainbowkit/styles.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'
import { useMemo } from 'react'

const wagmiConfig = getDefaultConfig({
  appName: 'Irion Hub',
  projectId: '3404862cca4501e4d84be405269d955c',
  chains: [algorandChain],
})

const rainbowkitConfig = createRainbowKitConfig({ wagmiConfig })

const walletManager = new WalletManager({
  wallets: [
    {
      id: WalletId.RAINBOWKIT,
      options: { wagmiConfig }
    },
    WalletId.PERA,
    WalletId.DEFLY,
    {
      id: WalletId.LUTE,
      options: { siteName: 'Irion Hub' }
    },
    WalletId.KIBISIS
  ],
  defaultNetwork: NetworkId.TESTNET,
  networks: {
    [NetworkId.TESTNET]: {
      algod: {
        baseServer: process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
        port: process.env.NEXT_PUBLIC_ALGOD_PORT || '443',
        token: process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
      }
    },
    [NetworkId.LOCALNET]: {
      algod: {
        baseServer: process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
        port: process.env.NEXT_PUBLIC_ALGOD_PORT || '443',
        token: process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
      }
    }
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,      // 30 seconds
        refetchOnWindowFocus: false,
      },
    },
  }), [])
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <WalletProvider manager={walletManager}>
        <WalletUIProvider rainbowkit={rainbowkitConfig} queryClient={queryClient}>
          {children}
          <Toaster position="bottom-right" richColors />
        </WalletUIProvider>
      </WalletProvider>
    </ThemeProvider>
    </QueryClientProvider>
  )
}
