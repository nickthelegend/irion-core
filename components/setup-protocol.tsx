"use client"

import { useState } from "react"
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, Zap, ShieldAlert } from "lucide-react"
import { useWallet } from "@txnlab/use-wallet-react"
import { algodClient, deployments } from "@/lib/algorand/client"
import algosdk from "algosdk"
import { toast } from "sonner"

export function SetupProtocol() {
  const { activeAddress, signer } = useWallet()
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState<{ id: string; name: string; status: "pending" | "loading" | "done" | "error" }[]>([
    { id: "usdc", name: "Opt-in to USDC Asset", status: "pending" },
    { id: "pool", name: "Initialize Lending Access", status: "pending" },
  ])

  const handleSetup = async () => {
    if (!activeAddress) return
    setLoading(true)

    try {
      // 1. USDC Opt-in
      setSteps(s => s.map(step => step.id === "usdc" ? { ...step, status: "loading" } : step))
      
      const sp = await algodClient.getTransactionParams().do()
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        to: activeAddress,
        assetIndex: deployments.usdc_asset_id,
        amount: 0,
        suggestedParams: sp,
      })

      // Send transaction (signer will handle it)
      const { txId } = await signer([optInTxn.toByte()], [0])
      await algosdk.waitForConfirmation(algodClient, txId, 4)
      
      setSteps(s => s.map(step => step.id === "usdc" ? { ...step, status: "done" } : step))

      // 2. Pool Access (Mock or application opt-in if needed)
      setSteps(s => s.map(step => step.id === "pool" ? { ...step, status: "loading" } : step))
      // In this protocol, boxes are used, so no explicit app opt-in is required for users.
      // We'll just mark it as done to signify ready state.
      await new Promise(r => setTimeout(r, 1000))
      setSteps(s => s.map(step => step.id === "pool" ? { ...step, status: "done" } : step))

      toast.success("Protocol setup complete!")
    } catch (error: any) {
      console.error(error)
      const failedId = steps.find(s => s.status === "loading")?.id || "usdc"
      setSteps(s => s.map(step => step.id === failedId ? { ...step, status: "error" } : step))
      toast.error(`Setup failed: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const isAllDone = steps.every(s => s.status === "done")

  return (
    <div className="bg-[#0d0f14] border border-primary/20 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <ShieldCheck size={120} />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="text-primary" size={20} /> One-Click Protocol Setup
        </h3>
        <p className="text-xs text-foreground/40 leading-relaxed max-w-md">
          To interact with the Irion Protocol, your wallet needs to be configured for USDC assets and on-chain messaging.
        </p>
      </div>

      <div className="space-y-3 py-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl transition-colors hover:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                {step.status === "loading" ? <Loader2 size={14} className="animate-spin text-primary" /> :
                 step.status === "done" ? <CheckCircle2 size={14} className="text-green-400" /> :
                 step.status === "error" ? <ShieldAlert size={14} className="text-red-400" /> :
                 <div className="size-2 rounded-full bg-white/20" />}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${step.status === "done" ? "text-white/60" : "text-white/40"}`}>
                {step.name}
              </span>
            </div>
            {step.status === "error" && <span className="text-[9px] text-red-400 font-bold uppercase italic tracking-tighter">Action Required</span>}
          </div>
        ))}
      </div>

      {isAllDone ? (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-green-400">
          <CheckCircle2 size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Setup Verified // Access Granted</span>
        </div>
      ) : (
        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,202,150,0.2)] disabled:opacity-50"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Finalizing...</> : "Initialize Protocol Access"}
        </button>
      )}
    </div>
  )
}
