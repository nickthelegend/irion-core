"use client"

import { useState, useEffect } from "react"
import { WalletButton } from '@txnlab/use-wallet-ui-react'
import {
  AlertTriangle, ShieldCheck, TrendingUp, CreditCard, Receipt, Zap,
  RefreshCw, Loader2, Lock, Unlock, Eye, Wallet, ChevronLeft, ChevronRight,
} from "lucide-react"
import { RepayDialog } from "@/components/credit/repay-dialog"

const STATUS_LABELS: Record<number, string> = { 0: "Active", 1: "Repaid", 2: "Defaulted" }
const PAGE_SIZE = 10

interface Loan { id: number; principal: string; interest: string; totalDebt: string; repaid: string; startTime: number; status: number; poolToken: string }

export default function CreditPage() {
  const [collateral, setCollateral] = useState("12450.00")
  const [externalValue, setExternalValue] = useState("5000.00")
  const [creditLine, setCreditLine] = useState(25000)
  const [onChainLimit, setOnChainLimit] = useState("30000")
  const [loans, setLoans] = useState<Loan[]>([
    { id: 101, principal: "500.00", interest: "12.50", totalDebt: "512.50", repaid: "0.00", startTime: Date.now(), status: 0, poolToken: "USDC" },
    { id: 98, principal: "1200.00", interest: "45.00", totalDebt: "1245.00", repaid: "1245.00", startTime: Date.now() - 86400000 * 10, status: 1, poolToken: "USDT" }
  ])
  const [repayOpen, setRepayOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [splitPlansData, setSplitPlansData] = useState<any[]>([
    { _id: "s1", loanId: 101, totalAmount: 512.50, installments: [
      { index: 0, status: "paid" },
      { index: 1, status: "pending" },
      { index: 2, status: "pending" }
    ] }
  ])
  const [repaymentData, setRepaymentData] = useState<any[]>([
    { _id: "r1", timestamp: Date.now() - 86400000, amount: 1245.0, loanType: "credit", txHash: "0x" + "b".repeat(64) }
  ])
  const [loanPage, setLoanPage] = useState(0)
  const [splitPage, setSplitPage] = useState(0)
  const [repayPage, setRepayPage] = useState(0)

  // Mocked Private Score state
  const ps = {
    isInitialized: true,
    decryptedScore: 785,
    decryptedLimit: 25000,
    loading: false,
    decrypting: false,
    error: null,
    contractAddress: "0x123...abc",
    initializeScore: () => {},
    decryptScore: () => {}
  }

  const handleRefresh = async () => { 
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const loanPages = Math.ceil(loans.length / PAGE_SIZE)
  const pagedLoans = [...loans].reverse().slice(loanPage * PAGE_SIZE, (loanPage + 1) * PAGE_SIZE)
  const splitPages = Math.ceil(splitPlansData.length / PAGE_SIZE)
  const pagedSplits = splitPlansData.slice(splitPage * PAGE_SIZE, (splitPage + 1) * PAGE_SIZE)
  const repayPages = Math.ceil(repaymentData.length / PAGE_SIZE)
  const pagedRepays = repaymentData.slice(repayPage * PAGE_SIZE, (repayPage + 1) * PAGE_SIZE)

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.4em] text-primary/60 uppercase">Credit_Engine // Terminal_Access</span>
          <h1 className="text-3xl tracking-tighter font-black uppercase">Credit Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-40">
            <RefreshCw className={`size-3 ${refreshing?"animate-spin":""}`} /> Sync
          </button>
          <button onClick={()=>setRepayOpen(true)} className="flex items-center gap-2 bg-purple-500/70 hover:bg-purple-500/90 rounded-xl px-5 py-2.5 text-[10px] uppercase tracking-widest font-black transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <CreditCard className="size-3.5" /> Repay
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl">
        <div className="bg-white/5 px-5 py-2.5 border-b border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Credit_Metrics</span>
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(166,242,74,0.5)] animate-pulse" /><span className="text-[9px] text-primary/60 uppercase tracking-widest">Live</span></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-white/5">
          <div className="p-5 flex flex-col gap-1 relative group">
            <span className="text-[10px] text-white/40 tracking-wider uppercase">Total_Collateral</span>
            <span className="text-white text-2xl font-bold tracking-tighter">{(parseFloat(collateral)+parseFloat(externalValue)).toLocaleString(undefined,{maximumFractionDigits:2})}</span>
            <span className="text-[9px] text-white/20 uppercase tracking-tighter">Oracle: {parseFloat(externalValue).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
            <ShieldCheck className="absolute bottom-2 right-2 w-8 h-8 text-primary/5 group-hover:text-primary/10 transition-colors" />
          </div>
          <div className="p-5 flex flex-col gap-1 relative group">
            <span className="text-[10px] text-white/40 tracking-wider uppercase">Available_Credit</span>
            <span className="text-primary text-2xl font-bold tracking-tighter">{creditLine.toLocaleString(undefined,{maximumFractionDigits:2})}</span>
            <span className="text-[9px] text-white/20 uppercase tracking-tighter">Borrowing power</span>
            <TrendingUp className="absolute bottom-2 right-2 w-8 h-8 text-primary/5 group-hover:text-primary/10 transition-colors" />
          </div>
          <div className="p-5 flex flex-col gap-1 relative group">
            <span className="text-[10px] text-white/40 tracking-wider uppercase">On-Chain_Limit</span>
            <span className="text-blue-400 text-2xl font-bold tracking-tighter">{parseFloat(onChainLimit).toLocaleString(undefined,{maximumFractionDigits:2})}</span>
            <span className="text-[9px] text-white/20 uppercase tracking-tighter">ScoreManager limit</span>
            <Zap className="absolute bottom-2 right-2 w-8 h-8 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" />
          </div>
        </div>
      </div>

      {/* Private Credit Score — Zama FHEVM */}
      <div className="glass-card rounded-lg border border-purple-500/20 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.05)]">
        <div className="bg-purple-500/5 px-5 py-2.5 border-b border-purple-500/10 flex justify-between items-center">
          <div className="flex items-center gap-2"><Lock className="size-3.5 text-purple-400" /><span className="text-[10px] text-purple-400/80 uppercase tracking-widest font-bold">Private_Credit_Score // Zama FHEVM</span></div>
          <span className="text-[9px] text-purple-400/40 font-bold">Encrypted On-Chain</span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-[10px] text-white/40 leading-relaxed mb-4">
                Your credit score is stored <span className="text-purple-400 font-bold">fully encrypted</span> using Zama&apos;s FHEVM.
                No one — not even the protocol — can see your score without your explicit signature consent.
              </p>
              {ps.decryptedScore !== null && (
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2"><Unlock className="size-3.5 text-green-400" /><span className="text-green-400 text-xl font-black tracking-tighter">{ps.decryptedScore}</span><span className="text-[9px] text-green-400/50 ml-1">SCORE</span></div>
                  {ps.decryptedLimit !== null && (
                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2"><Unlock className="size-3.5 text-blue-400" /><span className="text-blue-400 text-xl font-black tracking-tighter">{ps.decryptedLimit.toLocaleString()}</span><span className="text-[9px] text-blue-400/50 ml-1">LIMIT</span></div>
                  )}
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Decrypted via signature consent</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-2 opacity-60">
              <div className="size-16 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20"><Lock className="size-7 text-purple-400" /></div>
              <span className="text-[8px] text-purple-400/40 uppercase tracking-widest">FHE Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active BNPL Loans */}
      <div className="glass-card rounded-lg border border-white/10 overflow-hidden">
        <div className="bg-white/5 px-5 py-2.5 border-b border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Active_BNPL_Loans</span>
          <span className="text-[9px] text-primary/50 font-bold">{loans.length} total</span>
        </div>
        {loans.length === 0 ? (
          <div className="p-8 text-center"><p className="text-[10px] text-white/20 uppercase tracking-widest">No loans found</p></div>
        ) : (<>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">ID</th>
                <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Principal</th>
                <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Interest</th>
                <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Repaid</th>
                <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Status</th>
              </tr></thead>
              <tbody>
                {pagedLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-xs text-white font-bold">#{loan.id}</td>
                    <td className="px-5 py-3 text-xs text-white font-bold tracking-tighter">{parseFloat(loan.principal).toFixed(4)}</td>
                    <td className="px-5 py-3 text-xs text-white/60">{parseFloat(loan.interest).toFixed(4)}</td>
                    <td className="px-5 py-3 text-xs text-primary font-bold">{parseFloat(loan.repaid).toFixed(4)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${loan.status===0?"border-yellow-500/30 text-yellow-400 bg-yellow-500/10":loan.status===1?"border-green-500/30 text-green-400 bg-green-500/10":"border-red-500/30 text-red-400 bg-red-500/10"}`}>
                        {STATUS_LABELS[loan.status]??"Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}
      </div>

      {/* Split-in-3 Plans */}
      <div className="glass-card rounded-lg border border-white/10 overflow-hidden">
        <div className="bg-white/5 px-5 py-2.5 border-b border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Split-in-3_Plans</span>
          <span className="text-[9px] text-primary/50 font-bold">{splitPlansData.length} plans</span>
        </div>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-white/5">
          <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Loan</th>
          <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Total</th>
          <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Installments</th>
          <th className="text-left px-5 py-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">Progress</th>
        </tr></thead><tbody>
          {pagedSplits.map((plan:any) => { const pc=plan.installments?.filter((i:any)=>i.status==="paid").length||0; const tc=plan.installments?.length||3; return (
            <tr key={plan._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3 text-xs text-white font-bold">#{plan.loanId}</td>
              <td className="px-5 py-3 text-xs text-white font-bold tracking-tighter">{plan.totalAmount?.toFixed(4)}</td>
              <td className="px-5 py-3"><div className="flex gap-1.5">{plan.installments?.map((inst:any, idx: number)=>(
                <span key={idx} className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${inst.status==="paid"?"border-green-500/30 text-green-400 bg-green-500/10":inst.status==="overdue"?"border-red-500/30 text-red-400 bg-red-500/10":"border-white/10 text-white/40 bg-white/5"}`}>#{idx+1}</span>
              ))}</div></td>
              <td className="px-5 py-3"><span className={`text-[10px] font-bold ${pc===tc?"text-green-400":"text-yellow-400"}`}>{pc}/{tc}</span></td>
            </tr>
          )})}
        </tbody></table></div>
      </div>

      <RepayDialog open={repayOpen} onOpenChange={setRepayOpen} loans={loans} splitPlans={splitPlansData} onRepaymentComplete={handleRefresh} />
    </div>
  )
}
