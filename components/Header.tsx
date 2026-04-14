"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { SidebarDrawer } from "./sidebar-drawer"
import { cn } from "@/lib/utils"
// Using the starter's wallet button instead of Polaris's Ethereum one
import { WalletButton } from '@txnlab/use-wallet-ui-react'
import { useWallet } from '@txnlab/use-wallet-react'

const NAV = [
  { href: "/pools", label: "Pools" },
  { href: "/borrow", label: "Borrow" },
  { href: "/credit", label: "Credit" },
  { href: "/savings", label: "Savings" },
  { href: "/activity", label: "Activity" },
  { href: "/faucet", label: "Faucet" },
]

export function Header() {
  const pathname = usePathname()
  const { activeAddress } = useWallet()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full pt-3 pb-2 ">
      <div
        className="grid grid-cols-[auto_1fr_auto] items-center rounded-none sm:rounded-2xl bg-[#05080f]/75 border-x-0 sm:border-x border-y border-primary/20 backdrop-blur-2xl px-4 py-3 min-h-[60px] shadow-[inset_0_0_20px_rgba(0,202,150,0.05)]"
        role="navigation"
        aria-label="Main"
      >
        {/* Left: menu icon + logo */}
        <div className="flex items-center gap-2">
          <SidebarDrawer open={open} onOpenChange={setOpen} />
          <Link href="/" className="font-semibold tracking-wide ml-2">
            <Image src="/text-logo.png" alt="Irion Logo" width={140} height={40} className="h-10 w-auto rotate-90" />
          </Link>
        </div>

        {/* Center: nav, centered horizontally */}
        <nav className="hidden sm:flex items-center justify-center gap-2">
          {activeAddress && NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-xl px-3 py-1 text-sm transition-colors",
                pathname === n.href
                  ? "bg-primary text-black"
                  : "text-white/60 hover:text-white hover:bg-primary/15",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right: wallet actions */}
        <div className="flex items-center justify-end gap-3 min-w-0">
          <div className="wui-custom-trigger">
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  )
}
