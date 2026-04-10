"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface SplitPlan {
  _id: string
  loanId: number
  installments: Array<{
    index: number
    amount: number
    dueDate: number
    status: "paid" | "upcoming" | "overdue"
    paidAt?: number
    txHash?: string
  }>
}

interface RepayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loans: Array<{
    id: number
    principal: string
    interest: string
    totalDebt: string
    repaid: string
    status: number
  }>
  splitPlans?: SplitPlan[]
  onRepaymentComplete?: () => void
}

function getRemainingDebt(loan: RepayDialogProps["loans"][number]): string {
  const remaining = parseFloat(loan.totalDebt) - parseFloat(loan.repaid)
  return remaining > 0 ? remaining.toFixed(6) : "0"
}

export function RepayDialog({ open, onOpenChange, loans, splitPlans, onRepaymentComplete }: RepayDialogProps) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedLoanId("")
      setAmount("")
      setError(null)
      setSuccess(false)
      setTxHash(null)
    }
  }, [open])

  const activeLoans = loans.filter((l) => l.status === 0)
  const selectedLoan = activeLoans.find((l) => String(l.id) === selectedLoanId)

  const handlePayFull = () => {
    if (!selectedLoan) return
    setAmount(getRemainingDebt(selectedLoan))
  }

  /** Determine if a loan belongs to a Split-in-3 plan */
  function findSplitPlan(loanId: number): SplitPlan | undefined {
    return splitPlans?.find((p) => p.loanId === loanId)
  }

  const handleRepay = async () => {
    if (!selectedLoan || !amount) return
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      // Mocked repayment delay
      await new Promise(r => setTimeout(r, 1500))
      
      const mockHash = "0x" + "a".repeat(64)
      setTxHash(mockHash)
      setSuccess(true)
      toast.success("Repayment successful (Mock)")
      onRepaymentComplete?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0f14] border-border/30 text-white font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold tracking-tight">
            Repay Loan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Loan selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-foreground/40">Select Loan</label>
            <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
              <SelectTrigger className="w-full bg-[#05080f]/60 border-border/20 text-white">
                <SelectValue placeholder="Choose a loan" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0f14] border-border/30">
                {activeLoans.map((loan) => {
                  const plan = findSplitPlan(loan.id)
                  const typeLabel = plan ? "Split3" : "BNPL"
                  return (
                    <SelectItem key={loan.id} value={String(loan.id)} className="text-white font-mono">
                      Loan #{loan.id} ({typeLabel}) — {getRemainingDebt(loan)} remaining
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs text-foreground/40">Repayment Amount</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-[#05080f]/60 border border-border/20 rounded-md px-3 py-2 text-white font-mono text-sm placeholder:text-foreground/20 focus:outline-none focus:border-primary/40"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePayFull}
                disabled={!selectedLoan}
                className="border-primary/30 text-primary hover:bg-primary/10 text-xs"
              >
                Pay Full
              </Button>
            </div>
            {selectedLoan && (
              <p className="text-[10px] text-foreground/30">
                Remaining: {getRemainingDebt(selectedLoan)}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && txHash && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-xs text-green-400 font-mono space-y-1">
              <p>Repayment successful!</p>
              <p>TX: <span className="underline hover:text-green-300 transition-colors cursor-pointer">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span></p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/30 text-foreground/60 hover:text-white"
          >
            {success ? "Close" : "Cancel"}
          </Button>
          {!success && (
            <Button
              onClick={handleRepay}
              disabled={loading || !selectedLoanId || !amount || parseFloat(amount) <= 0}
              className="bg-purple-500/70 hover:bg-purple-500/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Repay"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RepayDialog
