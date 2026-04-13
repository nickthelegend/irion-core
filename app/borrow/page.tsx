"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Info, ShieldAlert, ChevronRight, Lock, Loader2 } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { toast } from "sonner"
import { useWallet } from '@txnlab/use-wallet-react'
import { useLenderPosition } from '@/lib/hooks/useLenderPosition'
import { useUserProfile } from '@/lib/hooks/useUserProfile'
import { SetupProtocol } from "@/components/setup-protocol"
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useInitiateLoan } from "@/lib/hooks/useContractActions"

const BORROW_ASSETS = [
  { symbol: "USDC", color: "bg-blue-500" },
  { symbol: "USDT", color: "bg-green-600" },
  { symbol: "BNB", color: "bg-yellow-500" },
]
const COLLATERAL_ASSETS = [
  { symbol: "WETH", color: "bg-blue-400" },
  { symbol: "WBTC", color: "bg-orange-500" },
  { symbol: "USDC", color: "bg-blue-500" },
]

function TokenDropdown({ options, value, onChange }: {
  options: { symbol: string; color: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.symbol === value) ?? options[0]
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 bg-[#1a1d24] border border-border/40 hover:border-primary/40 rounded-xl px-3 py-2.5 transition-colors min-w-[110px]">
        <TokenIcon symbol={selected.symbol} size={20} className="flex-shrink-0" />
        <span className="text-sm font-semibold text-white">{selected.symbol}</span>
        <ChevronDown size={13} className={`text-foreground/40 transition-transform ml-auto ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#0d0f14] border border-border/40 rounded-xl overflow-hidden shadow-2xl min-w-[130px]">
          {options.map(opt => (
            <button key={opt.symbol} type="button" onClick={() => { onChange(opt.symbol); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left">
              <TokenIcon symbol={opt.symbol} size={20} className="flex-shrink-0" />
              <span className="text-sm text-white">{opt.symbol}</span>
              {opt.symbol === value && <Check size={12} className="text-primary ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BorrowPage() {
  const [borrowAmount, setBorrowAmount] = useState("")
  const [collateralAmount, setCollateralAmount] = useState("")
  const [maxRate, setMaxRate] = useState("10")
  const [duration, setDuration] = useState("30")
  const [borrowAsset, setBorrowAsset] = useState("USDC")
  const [collateralAsset, setCollateralAsset] = useState("WETH")
  const [loadingUI, setLoadingUI] = useState(false)

  const { activeAddress } = useWallet()
  const { data: position } = useLenderPosition(activeAddress || undefined)
  const { data: userProfile } = useUserProfile(activeAddress || undefined)
  const initiateLoan = useInitiateLoan()

  const loading = loadingUI || initiateLoan.isPending

  const decryptingBalances = false
  const collateralBalance = position?.deposit_amount ?? 0
  const debtBalance = userProfile?.total_borrowed ?? 0

  const handleSubmit = async () => {
    if (!activeAddress) {
      toast.error("Please connect your wallet")
      return
    }
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      toast.error("Invalid borrow amount")
      return
    }

    setLoadingUI(true)
    try {
      // For this protocol version, we default to 4 installments
      // and a platform-wide merchant address if not specified.
      const placeholderMerchant = "6JGSBRX7M7M4FMDZ7U6D3XJXWQ4M4M4M4M4M4M4M4M4M4M4M4M4M4M4M" // Placeholder
      
      const result = await initiateLoan.mutateAsync({
        merchant: placeholderMerchant,
        amount_usdc: parseFloat(borrowAmount),
        num_installments: 4 
      })

      toast.success(`Loan initiated! Tx: ${result.txId.slice(0, 8)}...`)
      setBorrowAmount("")
      setCollateralAmount("")
    } catch (err: any) {
      console.error(err)
      toast.error(`Borrow failed: ${err.message || "Unknown error"}`)
    } finally {
      setLoadingUI(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">Active_Debt // terminal_access</span>
        <h1 className="text-white text-3xl tracking-tighter font-black uppercase">Execute Borrow</h1>
      </div>

      <SetupProtocol />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-[#0d0f14] border border-border/30 rounded-3xl overflow-hidden">
          <div className="p-8 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white">Issue Borrow Request</h3>
              <p className="text-xs text-foreground/40 mt-1 leading-relaxed">Submit a transparent borrow request. Your terms are recorded directly on the Algorand blockchain.</p>
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-2">
              <label className="text-xs text-foreground/40">{"You're borrowing"}</label>
              <div className="flex items-center gap-3">
                <input type="number" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-4xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <TokenDropdown options={BORROW_ASSETS} value={borrowAsset} onChange={setBorrowAsset} />
              </div>
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-2">
              <label className="text-xs text-foreground/40">Collateral ({collateralAsset})</label>
              <div className="flex items-center gap-3">
                <input type="number" value={collateralAmount} onChange={e => setCollateralAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-4xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <TokenDropdown options={COLLATERAL_ASSETS} value={collateralAsset} onChange={setCollateralAsset} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-1">
                <label className="text-xs text-foreground/40">Max Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={maxRate} onChange={e => setMaxRate(e.target.value)} className="flex-1 bg-transparent text-2xl font-light text-foreground/60 focus:outline-none min-w-0" />
                  <span className="text-foreground/30 text-sm">%</span>
                </div>
              </div>
              <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-1">
                <label className="text-xs text-foreground/40">Duration (days)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="flex-1 bg-transparent text-2xl font-bold text-foreground focus:outline-none min-w-0" />
                  <span className="text-foreground/30 text-sm">d</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#05080f]/40 border border-border/20 rounded-xl px-4 py-3">
              <Info size={14} className="text-foreground/30 flex-shrink-0" />
              <span className="text-xs text-foreground/40">Your borrow request is transparently recorded on-chain</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || (!borrowAmount && !collateralAmount)}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,202,150,0.2)]"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Borrow Request"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#05080f]/40 border border-border/40 rounded-3xl p-8 backdrop-blur-md space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-2">
              <ShieldAlert size={16} className="text-yellow-400" />Position_Risk_Audit
            </h3>
            <div className="space-y-4">
              {[
                { label: "Collateral", value: collateralBalance !== null ? `${collateralBalance}` : "0.00", muted: collateralBalance === null },
                { label: "Projected Loan Value", value: borrowAmount ? `${Number(borrowAmount).toLocaleString()}` : "—" },
                { label: "Debt Balance", value: debtBalance !== null ? `${debtBalance}` : "0.00", muted: debtBalance === null },
                { label: "Liquidation Price", value: "TBD", muted: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-[11px] border-b border-border/10 pb-4 last:border-0 last:pb-0">
                  <span className="text-foreground/40">{row.label}</span>
                  <span className={`font-bold flex items-center gap-1.5 ${row.muted ? "text-foreground/30 tracking-widest" : "text-primary"}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 space-y-4 group cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Collateral Transparency</h3>
              <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-foreground/60 leading-relaxed italic">
              All collateral levels are tracked transparently to ensure protocol solvency and fair market conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
