"use client"

import { useState, useEffect } from "react"
import { X, Loader2, CheckCircle2, ShieldCheck, AlertCircle, ExternalLink, Info } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { cn } from "@/lib/utils"
import { useDepositToPool, useWithdrawFromPool } from "@/lib/hooks/useContractActions"

export type ModalMode = "supply" | "borrow"

export type PoolInfo = {
  symbol: string
  name: string
  supplyApy: string
  borrowApy: string
}

type TxLog = {
  id: number
  step: string
  detail: React.ReactNode
  encrypted?: string
  status: "pending" | "done" | "error"
}

export function LendingActionModal({
  pool,
  mode,
  onClose,
}: {
  pool: PoolInfo
  mode: ModalMode
  onClose: () => void
}) {
  const [amount, setAmount] = useState("")
  const [logs, setLogs] = useState<TxLog[]>([])
  const [done, setDone] = useState(false)
  const [walletBalance, setWalletBalance] = useState<string | null>("100.00") // Mocked balance
  const [txHash, setTxHash] = useState<string | null>(null)

  const isSupply = mode === "supply"
  const apy = isSupply ? pool.supplyApy : pool.borrowApy
  const depositToPool = useDepositToPool()
  const withdrawFromPool = useWithdrawFromPool()
  const loading = depositToPool.isPending || withdrawFromPool.isPending

  // Max calculations (mocked)
  const maxAmount = isSupply ? walletBalance : (parseFloat(walletBalance || "0") * 0.8).toFixed(2)

  const addLog = (log: TxLog) => setLogs(prev => [...prev, log])
  const updateLog = (id: number, patch: Partial<TxLog>) =>
    setLogs(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)))

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setLogs([])
    setTxHash(null)
    setDone(false)

    try {
      if (isSupply) {
        const txId = await depositToPool.mutateAsync({ amount_usdc: parseFloat(amount) })
        addLog({ id: 2, step: "Deposit Confirmed", detail: `TX: ${txId}`, status: "done" })
      } else {
        const txId = await withdrawFromPool.mutateAsync({ lp_amount: parseFloat(amount) })
        addLog({ id: 2, step: "Withdraw Confirmed", detail: `TX: ${txId}`, status: "done" })
      }

      const fn = isSupply ? "supply" : "borrow"
      const mockHash = "success"
      setTxHash(mockHash)
      setDone(true)
    } catch (err: any) {
      addLog({ id: 99, step: "Error", detail: "Transaction failed (Mock)", status: "error" })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-[#0d0f14] border border-border/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 min-w-0 p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenIcon symbol={pool.symbol} size={26} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{pool.symbol}</p>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${isSupply ? "text-green-400" : "text-red-400"}`}>
                  {isSupply ? "Supply" : "Borrow"} · {apy} APY
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-foreground/40 uppercase tracking-[0.2em] font-black">
                {isSupply ? "Amount_to_supply" : "Amount_to_borrow"}
              </label>
              <button
                type="button"
                onClick={() => maxAmount && setAmount(maxAmount)}
                className="text-[10px] text-foreground/40 hover:text-primary transition-colors font-black uppercase tracking-widest"
              >
                Balance: <span className="font-mono font-bold text-foreground/70">{walletBalance} {pool.symbol}</span>
              </button>
            </div>
            <div className="flex items-center gap-3 bg-[#05080f]/40 border border-white/5 p-2 rounded-2xl group focus-within:border-primary/40 transition-all shadow-inner">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-3xl font-light text-foreground/70 placeholder:text-foreground/20 focus:outline-none min-w-0"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => maxAmount && setAmount(maxAmount)}
                  className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all border border-primary/20"
                >
                  MAX
                </button>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-widest",
                  isSupply ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                )}>
                  <TokenIcon symbol={pool.symbol} size={14} className="flex-shrink-0" />
                  {pool.symbol}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#05080f]/60 border border-border/20 rounded-xl p-3 text-center">
              <p className="text-[9px] text-foreground/40 uppercase tracking-widest mb-1">APY</p>
              <p className={`text-sm font-bold ${isSupply ? "text-green-400" : "text-red-400"}`}>{apy}</p>
            </div>
            <div className="bg-[#05080f]/60 border border-border/20 rounded-xl p-3 text-center">
              <p className="text-[9px] text-foreground/40 uppercase tracking-widest mb-1">Health Factor</p>
              <p className="text-sm font-bold text-primary">{amount ? "~1.92" : "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#05080f]/40 border border-border/20 rounded-xl px-4 py-3">
            <Info size={12} className="text-primary/50 flex-shrink-0" />
            <span className="text-[10px] text-foreground/40">Your transaction will be processed on the Algorand blockchain</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !amount || done}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-tighter transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]",
              isSupply 
                ? "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,202,150,0.2)] text-black" 
                : "bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)] text-white"
            )}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {done ? "Done ✓" : isSupply ? `Supply_${pool.symbol}` : `Borrow_${pool.symbol}`}
          </button>
        </div>

        <div className="w-full md:w-64 flex-shrink-0 bg-[#05080f]/80 border-t md:border-t-0 md:border-l border-border/20 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-primary/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Tx Log</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-64 md:max-h-none">
            {logs.length === 0 ? (
              <p className="text-[10px] text-foreground/20 italic text-center pt-4">
                Submit transaction to see progress
              </p>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`rounded-xl p-3 border text-[10px] space-y-1 ${
                    log.status === "done" ? "border-green-500/20 bg-green-500/5" :
                    log.status === "error" ? "border-red-500/20 bg-red-500/5" :
                    "border-border/20 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {log.status === "pending" && <Loader2 size={9} className="animate-spin text-primary/60 flex-shrink-0" />}
                    {log.status === "done" && <CheckCircle2 size={9} className="text-green-400 flex-shrink-0" />}
                    {log.status === "error" && <AlertCircle size={9} className="text-red-400 flex-shrink-0" />}
                    <span className={`font-bold uppercase tracking-wider truncate ${
                      log.status === "done" ? "text-green-400" :
                      log.status === "error" ? "text-red-400" :
                      "text-foreground/50"
                    }`}>{log.step}</span>
                  </div>
                  <div className="text-foreground/40 pl-4 leading-relaxed">{log.detail}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
