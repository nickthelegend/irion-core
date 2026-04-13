"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowDown, ShieldCheck, Lock, TrendingUp, Zap,
  History, Target, ArrowUpRight, X, Database, Loader2, Terminal
} from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { toast } from "sonner"
import { useWallet } from '@txnlab/use-wallet-react'
import { useLenderPosition } from '@/lib/hooks/useLenderPosition'
import { SetupProtocol } from "@/components/setup-protocol"
import { getLendingPoolClient, deployments, algodClient } from '@/lib/algorand/client'
import algosdk from 'algosdk'

type Position = {
  type: "SUPPLY" | "BORROW"
  symbol: string
  amount: string
  value: string
  apy: string
}

type LogEntry = { ts: number; msg: string; type: "info" | "ok" | "err" | "wait" }

function ManageModal({ pos, onClose }: { pos: Position; onClose: () => void }) {
  const isSupply = pos.type === "SUPPLY"
  const [tab, setTab] = useState<"add" | "withdraw">("add")
  const [amount, setAmount] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  const currentBalance = "1000.00" // Mocked balance

  const log = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs(prev => [...prev, { ts: Date.now(), msg, type }])
  }

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [logs])

  const supplyTabs = [
    { key: "add", label: isSupply ? "Supply More" : "Borrow More" },
    { key: "withdraw", label: isSupply ? "Withdraw" : "Repay" },
  ] as const

  const { activeAddress, signer } = useWallet()

  const handleAction = async () => {
    if (!amount || !activeAddress) return
    setLogs([])
    setLoading(true)
    const action = tab === "add" ? (isSupply ? "Supply" : "Borrow") : (isSupply ? "Withdraw" : "Repay")

    try {
      log(`[SYNC] Starting ${action} for ${amount} ${pos.symbol}`, "info")
      log(`[SYNC] Preparing atomic group...`, "wait")

      if (action === "Repay") {
        const client = getLendingPoolClient(activeAddress)
        const amountMicro = BigInt(parseFloat(amount) * 1_000_000)
        
        // 1. Transaction to send USDC to Pool
        const sp = await algodClient.getTransactionParams().do()
        const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: activeAddress,
          to: algosdk.getApplicationAddress(deployments.lending_pool_app_id),
          amount: amountMicro,
          assetIndex: deployments.usdc_asset_id,
          suggestedParams: sp,
        })

        // 2. Call repay method
        log(`[TX] Calling repay(axfer, ${activeAddress})...`, "info")
        const result = await client.send.repay({
          args: {
            payment: axfer,
            borrower: algosdk.decodeAddress(activeAddress).publicKey,
          },
          extraFee: algosdk.microalgos(1000) // Cover inner txn if any
        })
        
        log(`[TX] Submitted Hash: ${result.txId.slice(0, 10)}...`, "ok")
        log(`[TX] Confirmed in round ${result.confirmation?.['confirmed-round']}`, "ok")
      } else {
        // Mock other actions for now
        log(`[MOCK] ${action} executed successfully (UI only)`, "ok")
      }

      log(`[DONE] ${action} complete!`, "ok")
      setLoading(false)
      toast.success(`${action} submitted successfully`)
    } catch (error: any) {
      log(`[ERR] ${error.message || "Transaction failed"}`, "err")
      setLoading(false)
      toast.error(`${action} failed: ${error.message}`)
    }
  }

  const logColor = (t: LogEntry["type"]) => t === "ok" ? "text-green-400" : t === "err" ? "text-red-400" : t === "wait" ? "text-yellow-400" : "text-white/50"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0d0f14] border border-border/40 rounded-3xl overflow-hidden shadow-2xl flex" onClick={e => e.stopPropagation()}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/20">
            <div className="flex items-center gap-3">
              <TokenIcon symbol={pos.symbol} size={32} className="flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">{pos.symbol}</div>
                <div className={`text-[10px] uppercase tracking-widest ${isSupply ? "text-green-400" : "text-red-400"}`}>{pos.type}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-foreground/40 hover:text-white"><X size={16} /></button>
          </div>
          <div className="flex gap-1 p-2 bg-[#05080f]/60 border-b border-border/20">
            {supplyTabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? "bg-[#1a1d24] text-white border border-border/30" : "text-foreground/40 hover:text-foreground/70"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-foreground/40 uppercase tracking-widest block mb-1">Your {isSupply ? "Supplied" : "Debt"} Balance</span>
                <span className="text-lg font-bold text-white">{currentBalance} <span className="text-xs text-foreground/40">{pos.symbol}</span></span>
              </div>
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2">
              <label className="text-xs text-foreground/40">
                {tab === "add" ? (isSupply ? "Amount to supply" : "Amount to borrow") : (isSupply ? "Amount to withdraw" : "Amount to repay")}
              </label>
              <div className="flex items-center gap-3">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-3xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isSupply ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                  <TokenIcon symbol={pos.symbol} size={16} className="flex-shrink-0" />
                  <span className="text-sm font-bold">{pos.symbol}</span>
                </div>
              </div>
            </div>
            <button onClick={handleAction} disabled={loading || !amount}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isSupply ? "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50" : "bg-red-500/80 hover:bg-red-500 text-white disabled:opacity-50"}`}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {tab === "add" ? (isSupply ? "Confirm Supply" : "Confirm Borrow") : (isSupply ? "Confirm Withdraw" : "Confirm Repay")}
            </button>
          </div>
        </div>

        <div className="w-80 border-l border-border/20 bg-[#05080f]/80 flex flex-col">
          <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
            <Terminal size={14} className="text-primary" />
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Transaction_Log</span>
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[400px] font-mono">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Terminal size={24} className="text-white/10 mb-3" />
                <p className="text-[9px] text-white/20 uppercase tracking-widest">Awaiting transaction...</p>
              </div>
            ) : logs.map((l, i) => (
              <div key={i} className={`text-[10px] leading-relaxed ${logColor(l.type)}`}>
                <span className="text-white/20 mr-1">{new Date(l.ts).toLocaleTimeString()}</span>
                {l.type === "wait" && <Loader2 size={10} className="inline animate-spin mr-1" />}
                {l.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PositionsPage() {
  const [managingPos, setManagingPos] = useState<Position | null>(null)
  
  const { activeAddress } = useWallet()
  const { data: pData } = useLenderPosition(activeAddress || undefined)

  const positions: Position[] = pData?.deposit_amount ? [
    { type: "SUPPLY", symbol: "USDC", amount: pData.deposit_amount.toString(), value: `$${pData.deposit_amount.toFixed(2)}`, apy: "8.5%" }
  ] : []

  const fmtBal = (s: string) => s
  const isDecrypted = true

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      {managingPos && <ManageModal pos={managingPos} onClose={() => setManagingPos(null)} />}

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.4em] text-primary/60 uppercase">Savings_Positions // audit_access</span>
          <h1 className="text-3xl tracking-tighter font-black uppercase">My Savings</h1>
        </div>
      </div>

      <SetupProtocol />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#05080f]/40 border border-primary/20 rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Lock size={80} /></div>
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Net_Supply</span>
          <div className="text-3xl font-bold tracking-tight">${pData?.deposit_amount?.toFixed(2) ?? '0.00'}</div>
          <span className="text-[10px] text-primary/60 flex items-center gap-1 mt-2 uppercase tracking-widest">
            <ShieldCheck size={12} />Verified
          </span>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={80} /></div>
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Net_Debt</span>
          <div className="text-3xl font-bold tracking-tight">$500.00</div>
          <div className="text-[10px] text-red-400 flex items-center gap-1 mt-2 uppercase tracking-widest">
            <TrendingUp size={12} />Verified
          </div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-6 flex flex-col gap-2">
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Collateral</span>
          <div className="text-3xl font-bold tracking-tight text-primary">$12,450.00</div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-6 flex flex-col gap-2">
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Health_Factor</span>
          <div className="text-3xl font-bold tracking-tight text-green-400">1.92</div>
        </div>
      </div>

      <div className="bg-card/20 border border-border/40 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="grid grid-cols-12 bg-white/5 border-b border-border/20 px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 items-center">
          <div className="col-span-4">Position Detail</div>
          <div className="col-span-2 text-right">Balance</div>
          <div className="col-span-2 text-right">Value ($)</div>
          <div className="col-span-2 text-right">Net APY</div>
          <div className="col-span-2 text-right">Control</div>
        </div>
        <div className="divide-y divide-border/10">
          {positions.map((pos) => (
            <div key={`${pos.type}-${pos.symbol}`} className="grid grid-cols-12 px-8 py-8 items-center hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => setManagingPos(pos)}>
              <div className="col-span-4 flex items-center gap-5">
                <div className={`p-1.5 rounded-lg ${pos.type === "SUPPLY" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {pos.type === "SUPPLY" ? <ArrowDown size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">{pos.symbol}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${pos.type === "SUPPLY" ? "border-green-500/20 text-green-400" : "border-red-500/20 text-red-400"}`}>{pos.type}</span>
                  </div>
                  <div className="text-[10px] text-foreground/40 font-mono tracking-tighter uppercase mt-0.5">ACTIVE_POSITION_{pos.symbol}</div>
                </div>
              </div>
              <div className="col-span-2 text-right"><div className="text-sm font-bold font-mono text-white/50">{pos.amount}</div></div>
              <div className="col-span-2 text-right"><div className="text-sm font-bold font-mono text-white/50">{pos.value}</div></div>
              <div className="col-span-2 text-right"><div className={`text-sm font-bold ${pos.type === "SUPPLY" ? "text-green-400" : "text-red-400"}`}>{pos.type === "SUPPLY" ? "+" : "-"}{pos.apy}</div></div>
              <div className="col-span-2 flex justify-end">
                <button onClick={e => { e.stopPropagation(); setManagingPos(pos) }}
                  className={`py-2 px-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${pos.type === "SUPPLY" ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20" : "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
