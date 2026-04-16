'use client'

import { NetworkId, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react'
import '@txnlab/use-wallet-ui-react/dist/style.css'

import { QueryProvider } from '@/lib/providers/QueryProvider'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'

const walletManager = new WalletManager({
  wallets: [
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
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <WalletProvider manager={walletManager}>
        <WalletUIProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </WalletUIProvider>
      </WalletProvider>
    </ThemeProvider>
    </QueryProvider>
  )
}
