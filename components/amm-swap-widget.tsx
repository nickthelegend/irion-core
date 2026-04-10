"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight, Info, Loader2 } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Shield, ShieldOff, Lock } from "lucide-react"

const TOKENS = [
  { symbol: "WETH", decimals: 18, color: "bg-blue-400" },
  { symbol: "BNB", decimals: 18, color: "bg-yellow-500" },
  { symbol: "USDC", decimals: 6, color: "bg-blue-500" },
  { symbol: "USDT", decimals: 6, color: "bg-green-600" },
]

export function AMMSwapWidget() {
  // Mocked state for UI-only starter
  const isConnected = true 
  const address = "0x1234...5678"
  
  const [fromToken, setFromToken] = useState(TOKENS[0]) // WETH
  const [toToken, setToToken] = useState(TOKENS[2]) // USDC
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [isConfidential, setIsConfidential] = useState(false)

  // Mocked logic for UI demonstration
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      // Dummy exchange rate: 1 WETH = 2500 USDC
      const rate = toToken.symbol === "USDC" || toToken.symbol === "USDT" ? 2500 : 0.0004
      setToAmount((parseFloat(fromAmount) * rate).toFixed(2))
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromToken, toToken])

  const handleApprove = async () => {
    setIsApproving(true)
    setTimeout(() => {
      setIsApproving(false)
      toast.success("Token approved (Mock)")
    }, 1500)
  }

  const handleSwap = async () => {
    setIsSwapping(true)
    setTimeout(() => {
      setIsSwapping(false)
      toast.success("Swap executed (Mock)")
    }, 2000)
  }

  const handleFlipTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount("")
  }

  const needsApproval = parseFloat(fromAmount) > 10 // Mock condition
  const canSwap = fromAmount && parseFloat(fromAmount) > 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">AMM Swap</h3>
        <p className="text-xs text-foreground/40 mt-1">
          Swap tokens using our AMM pools with 0.3% fee
        </p>
      </div>

      {/* Confidential Toggle */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isConfidential ? "bg-primary/20 text-primary" : "bg-foreground/5 text-foreground/40"}`}>
            {isConfidential ? <Shield size={18} /> : <ShieldOff size={18} />}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Confidential Mode</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest">Powered by Zama FHEVM</p>
          </div>
        </div>
        <button 
          onClick={() => setIsConfidential(!isConfidential)}
          className={`relative w-11 h-6 rounded-full transition-colors ${isConfidential ? "bg-primary" : "bg-foreground/20"}`}
        >
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isConfidential ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {/* From Token */}
      <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2 group focus-within:border-primary/40 transition-all">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">From_Source</label>
          <span className="text-[10px] text-foreground/30 font-black uppercase tracking-widest">
            Balance: 10.00
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-3xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0"
          />
          <div className="flex items-center gap-2 bg-[#1a1d24] border border-border/40 rounded-xl px-3 py-2.5 shadow-sm">
            <TokenIcon symbol={fromToken.symbol} size={20} />
            <span className="text-sm font-black text-white">{fromToken.symbol}</span>
          </div>
        </div>
      </div>

      {/* Flip Button */}
      <div className="flex justify-center">
        <button
          onClick={handleFlipTokens}
          className="p-2 rounded-full bg-[#1a1d24] border border-border/30 hover:border-primary/40 transition-colors cursor-pointer"
        >
          <ArrowLeftRight size={16} className="text-foreground/40" />
        </button>
      </div>

      {/* To Token */}
      <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2">
        <label className="text-[10px] text-foreground/40 font-black uppercase tracking-widest text-primary/60 animate-pulse">To_Destination (est)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={toAmount}
            readOnly
            placeholder="0"
            className="flex-1 bg-transparent text-3xl font-light text-primary/40 placeholder:text-foreground/20 focus:outline-none min-w-0"
          />
          <div className="flex items-center gap-2 bg-[#1a1d24] border border-border/40 rounded-xl px-3 py-2.5">
            <TokenIcon symbol={toToken.symbol} size={20} />
            <span className="text-sm font-black text-white">{toToken.symbol}</span>
          </div>
        </div>
      </div>

      {/* Swap Info */}
      {fromAmount && toAmount && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-foreground/40">Rate</span>
            <span className="text-foreground/70">
              1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(4)} {toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-foreground/40">Fee (0.3%)</span>
            <span className="text-foreground/70">
              {(parseFloat(fromAmount) * 0.003).toFixed(6)} {fromToken.symbol}
            </span>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="flex items-center gap-2 bg-[#05080f]/40 border border-border/20 rounded-xl px-4 py-3">
        {isConfidential ? <Lock size={14} className="text-primary/60 flex-shrink-0" /> : <Info size={14} className="text-foreground/30 flex-shrink-0" />}
        <span className="text-xs text-foreground/40">
          {isConfidential 
            ? "Confidential swaps are executed via encrypted inputs — only you see the amount" 
            : "Swaps are executed on-chain via AMM pools"}
        </span>
      </div>

      {/* Action Buttons */}
      {!isConnected ? (
        <button
          disabled
          className="w-full py-4 rounded-2xl bg-foreground/10 text-foreground/40 font-black text-sm uppercase tracking-widest"
        >
          Connect_Wallet_Interface
        </button>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black text-sm uppercase tracking-tighter transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,202,150,0.2)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {isApproving && <Loader2 size={16} className="animate-spin" />}
          {isApproving ? "Authorizing..." : `Approve_${fromToken.symbol}`}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={!canSwap || isSwapping}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-tighter transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]",
            isConfidential 
              ? "bg-primary text-black shadow-[0_0_20px_rgba(0,202,150,0.3)]" 
              : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
          )}
        >
          {isSwapping && <Loader2 size={16} className="animate-spin" />}
          {isSwapping ? "Verifying..." : isConfidential ? "Confidential_Swap" : "Public_Swap"}
        </button>
      )}
    </div>
  )
}
