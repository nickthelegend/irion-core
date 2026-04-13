"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Info, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const FAUCET_TOKENS = [
  { symbol: "WETH", decimals: 18, max: 100_000_000 },
  { symbol: "USDC", decimals: 6,  max: 100_000_000 },
  { symbol: "USDT", decimals: 6,  max: 100_000_000 },
  { symbol: "BNB",  decimals: 18, max: 100_000_000 },
]

function TokenDropdown({ options, value, onChange }: {
  options: typeof FAUCET_TOKENS
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
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#0d0f14] border border-border/40 rounded-xl overflow-hidden shadow-2xl min-w-[140px]">
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

export default function FaucetPage() {
  const [token, setToken] = useState("USDC")
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [txHash, setTxHash] = useState("")

  const selected = FAUCET_TOKENS.find(t => t.symbol === token) ?? FAUCET_TOKENS[0]
  const parsedAmount = parseFloat(amount)
  const isOverMax = !isNaN(parsedAmount) && parsedAmount > selected.max
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0 && !isOverMax
  const canSubmit = isValidAmount && recipient.length > 0

  const handleDispense = async () => {
    if (!canSubmit) return
    setStatus("loading")
    
    try {
      if (token !== "USDC") {
        throw new Error("Only USDC testnet minting is currently supported.")
      }
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: recipient })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to mint")

      setStatus("success")
      setTxHash(data.tx_id)
      toast.success(`Minted ${amount} ${token} successfully! TX: ${data.tx_id.slice(0,8)}...`)
      setAmount("")
    } catch (err: any) {
      setStatus("error")
      toast.error(err.message)
    }
  }

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase animate-pulse">Lending_Faucet // testnet_resources</span>
        <h1 className="text-white text-3xl md:text-5xl tracking-tighter font-black uppercase italic">Testnet_Resources</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-[#0d0f14] border border-border/30 rounded-3xl overflow-hidden">
          <div className="p-8 space-y-5">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-widest text-white">Mint_Test_Tokens</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">
                Direct_Protocol_Minting // Mock_Access
              </p>
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-2 group focus-within:border-primary/40 transition-all">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Recipient_Address</label>
              <input type="text" value={recipient} onChange={e => setRecipient(e.target.value.trim())}
                placeholder="ADDRESS_HEX"
                className={`w-full bg-transparent text-sm font-mono placeholder:text-foreground/20 focus:outline-none text-foreground/70`} />
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-3 group focus-within:border-primary/40 transition-all">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Amount_To_Mint</label>
              <div className="flex items-center gap-3">
                <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setStatus("idle") }}
                  placeholder="0"
                  className={`flex-1 bg-transparent text-4xl font-light tracking-tighter placeholder:text-foreground/20 focus:outline-none min-w-0 ${isOverMax ? "text-red-400" : "text-foreground/60"}`} />
               <TokenDropdown options={FAUCET_TOKENS} value={token} onChange={v => { setToken(v); setAmount(""); setStatus("idle") }} />
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-foreground/30">Max_Per_Request</span>
                <button type="button" onClick={() => setAmount(selected.max.toString())}
                  className="text-primary/70 hover:text-primary font-black transition-colors">
                  {selected.max.toLocaleString()} {token}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-tighter text-primary/40">Tokens_minted_directly_via_mock_interface</span>
            </div>

            <button 
              onClick={handleDispense} 
              disabled={status === "loading" || !canSubmit}
              className={cn(
                "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-tighter transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(166,242,74,0.1)]",
                status === "loading" || !canSubmit ? "bg-white/5 text-foreground/20" : "bg-primary text-black"
              )}
            >
              {status === "loading"
                ? <><Loader2 size={16} className="animate-spin" /> MINTING_RESOURCES...</>
                : `MINT_${amount ? Number(amount).toLocaleString() : "—"}_${token}`}
            </button>

            {status === "success" && (
              <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 size={14} /> Minted Successfully
                </div>
                <div className="text-[10px] text-green-400/40 font-mono truncate">TX: {txHash}</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#05080f]/40 border border-border/40 rounded-3xl p-8 backdrop-blur-md space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">How_It_Works</span>
            </div>
           <div className="space-y-2 text-[11px] text-foreground/40 leading-relaxed font-mono">
              <p>Status: <span className="text-primary/60">LIVE (DEMO)</span></p>
              <p>Resources: <span className="text-primary/60">Algorand Testnet</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
