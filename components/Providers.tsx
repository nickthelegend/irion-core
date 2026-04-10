'use client'

import { NetworkId, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react'
import '@txnlab/use-wallet-ui-react/dist/style.css'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'

const walletManager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY, WalletId.LUTE],
  defaultNetwork: NetworkId.TESTNET,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <WalletProvider manager={walletManager}>
        <WalletUIProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </WalletUIProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}
