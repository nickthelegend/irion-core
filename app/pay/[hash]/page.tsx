"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ShieldCheck, Zap, Lock, Loader2, CheckCircle2, AlertCircle, 
  ArrowRight, Landmark, CreditCard, ChevronRight
} from "lucide-react"
import { getBNPLCreditClient, deployments } from "@/lib/algorand/client"
import { algo } from "@algorandfoundation/algokit-utils"
import { useWallet } from "@txnlab/use-wallet-react"
import { toast } from "sonner"
import { TokenIcon } from "@/components/token-icon"

interface BillDetails {
  amount: number
  description: string
  merchant: {
    name: string
    escrow_contract: string
    user?: { wallet_address: string }
  }
  status: string
}

export default function PaymentHub() {
  const { hash } = useParams()
  const router = useRouter()
  const { activeAddress, transactionSigner } = useWallet()
  const [bill, setBill] = useState<BillDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchBill() {
      try {
        const res = await fetch(`http://localhost:3001/api/bills/${hash}`)
        if (!res.ok) throw new Error("Bill not found")
        const data = await res.json()
        setBill(data)
      } catch (err: any) {
        setError(err.message)
        setStatus("error")
      } finally {
        setLoading(false)
      }
    }
    if (hash) fetchBill()
  }, [hash])

  const handlePayment = async () => {
    if (!bill || !activeAddress || processing) return
    setProcessing(true)
    console.log("[IRION-DEBUG] Hub: Processing Payment", { hash, amount: bill.amount })

    try {
      const client = getBNPLCreditClient(activeAddress, transactionSigner)
      const amountMicro = BigInt(Math.round(bill.amount * 1_000_000))
      
      // The merchant address in the contract for BNPL is the Merchant's wallet
      const merchantAddress = bill.merchant.user?.wallet_address || activeAddress

      console.log("[IRION-DEBUG] Hub: Calling initiate_loan", { merchant: merchantAddress, amount: amountMicro })
      
      const result = await client.send.initiateLoan({
        args: {
            merchant: merchantAddress,
            amount: amountMicro,
            numInstallments: BigInt(3) // Default BNPL installments
        },
        extraFee: algo(0.002) // Inner borrow call
      })

      console.log("[IRION-DEBUG] Hub: Payment Success", result.transaction.txID())
      setStatus("success")
      
      // Notify the opener (Shopping App)
      if (window.opener) {
        window.opener.postMessage({
          type: "Irion_PAYMENT_RESULT",
          success: true,
          txHash: result.transaction.txID(),
          amount: bill.amount,
          paymentMode: "bnpl"
        }, "*")
        
        // Auto-close after 3 seconds
        setTimeout(() => window.close(), 3000)
      }
    } catch (err: any) {
      console.error("[IRION-DEBUG] Hub: Payment Error", err)
      setError(err.message || "Transaction failed")
      setStatus("error")
      
      if (window.opener) {
        window.opener.postMessage({
          type: "Irion_PAYMENT_RESULT",
          success: false,
          error: err.message
        }, "*")
      }
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080f] flex flex-col items-center justify-center p-8 text-white font-mono">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <span className="text-[10px] tracking-[0.4em] uppercase text-primary/40">Decrypting_Settlement_Data</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_20px_rgba(0,255,163,0.5)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,163,0.05),transparent)] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0d0f14] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                <ShieldCheck className="text-primary w-6 h-6" />
             </div>
             <div>
                <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Checkout_Hub</h1>
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Secure_Session_v2.4</span>
             </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Network</div>
             <div className="text-[10px] text-green-400 font-black uppercase tracking-tighter flex items-center gap-1 justify-end">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" /> ALGORAND_LOCALNET
             </div>
          </div>
        </div>

        {status === "idle" && bill && (
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold block mb-4">Settlement_Summary</span>
              <div className="flex justify-between items-end mb-6">
                <div>
                   <span className="text-[11px] text-white/60 block mb-1">Total_Amount</span>
                   <div className="text-4xl font-black tracking-tighter">${bill.amount.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-2 py-1 rounded border border-primary/20">
                   <TokenIcon symbol="USDC" size={12} />
                   <span className="text-[10px] font-black text-primary uppercase">USDC</span>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between text-[11px]">
                   <span className="text-white/40 italic">Merchant</span>
                   <span className="font-bold text-white uppercase tracking-tighter">{bill.merchant.name}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                   <span className="text-white/40 italic">Description</span>
                   <span className="text-white/60 truncate max-w-[180px]">{bill.description}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
               <button 
                 onClick={handlePayment}
                 disabled={processing || !activeAddress}
                 className="w-full group bg-primary hover:bg-primary/90 disabled:opacity-50 text-black h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_10px_30px_rgba(0,255,163,0.3)]"
               >
                 {processing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                   <>
                     <span>Confirm_Payment</span>
                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
               </button>
               {!activeAddress && <p className="text-center text-[10px] text-red-400 font-bold uppercase tracking-widest">Connect Wallet to Continue</p>}
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 opacity-60">
               <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
               <p className="text-[9px] leading-relaxed uppercase tracking-wider text-white/60">Your payment will be split into installments automatically as per the BNPL contract rules.</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-25" />
                <CheckCircle2 className="w-10 h-10 text-green-500" />
             </div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-green-400 mb-2">Payment_Verified</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed px-4">Deployment successful. You will be redirected back in 3 seconds.</p>
             </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-8 space-y-6 text-center animate-in slide-in-from-bottom-4 duration-300">
             <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-red-400 mb-2">Protocol_Error</h2>
                <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg">
                   <p className="text-[10px] text-red-400/80 font-mono tracking-tighter lowercase leading-tight">{error}</p>
                </div>
             </div>
             <button onClick={() => setStatus("idle")} className="text-[10px] text-white/40 hover:text-white uppercase tracking-[0.3em] font-black underline underline-offset-4">Try_Again</button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center space-y-2 opacity-30">
        <p className="text-[9px] uppercase tracking-[0.5em] font-bold">Irion Secure Settlement Hub</p>
        <div className="flex items-center gap-4 justify-center">
           <div className="flex items-center gap-1"><Lock size={8} /> <span className="text-[8px] uppercase">AES-256</span></div>
           <div className="flex items-center gap-1"><ShieldCheck size={8} /> <span className="text-[8px] uppercase">AVM_SECURE</span></div>
        </div>
      </div>
    </div>
  )
}
