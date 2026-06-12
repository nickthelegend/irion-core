import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Loan } from '@/lib/db/models/loan.model'
import { fetchLoan } from '@/lib/algorand/readChain'
import { encodeAddress } from 'algosdk'

export async function GET(req: NextRequest, { params }: { params: Promise<{ loan_id: string }> }) {
  try {
    const { loan_id } = await params
    await connectDB()
    const id = Number(loan_id)

    // Always fetch fresh state from the chain
    const onChain = await fetchLoan(id)
    if (!onChain) {
      await Loan.deleteOne({ loan_id: id })
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    const statusNum = Number(onChain.status ?? BigInt(0))
    const statusStr = ['active', 'completed', 'defaulted', 'disputed'][statusNum] ?? 'active'
    const principalUsdc = Number(onChain.principal ?? BigInt(0)) / 1_000_000
    const totalRepaidUsdc = Number(onChain.total_repaid ?? BigInt(0)) / 1_000_000

    if (statusStr === 'completed' || totalRepaidUsdc >= principalUsdc) {
      // Clear it from the database!
      await Loan.deleteOne({ loan_id: id })
      
      // Return the completed state for UI representation
      return NextResponse.json({
        loan_id: id,
        borrower_address: onChain.borrower ? encodeAddress(onChain.borrower) : '',
        merchant_address: onChain.merchant ? encodeAddress(onChain.merchant) : '',
        principal_usdc: principalUsdc,
        total_repaid_usdc: totalRepaidUsdc,
        installment_amount_usdc: Number(onChain.installment_amount ?? BigInt(0)) / 1_000_000,
        num_installments: Number(onChain.num_installments ?? BigInt(0)),
        installments_paid: Number(onChain.installments_paid ?? BigInt(0)),
        start_round: 0,
        next_due_round: Number(onChain.next_due_round ?? BigInt(0)),
        status: 'completed',
      })
    }

    // Otherwise, upsert the updated loan details
    const loan = await Loan.findOneAndUpdate(
      { loan_id: id },
      {
        loan_id: id,
        borrower_address: onChain.borrower ? encodeAddress(onChain.borrower) : '',
        merchant_address: onChain.merchant ? encodeAddress(onChain.merchant) : '',
        principal_usdc: principalUsdc,
        total_repaid_usdc: totalRepaidUsdc,
        installment_amount_usdc: Number(onChain.installment_amount ?? BigInt(0)) / 1_000_000,
        num_installments: Number(onChain.num_installments ?? BigInt(0)),
        installments_paid: Number(onChain.installments_paid ?? BigInt(0)),
        start_round: 0,
        next_due_round: Number(onChain.next_due_round ?? BigInt(0)),
        status: statusStr,
      },
      { upsert: true, new: true }
    )
    return NextResponse.json(loan)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

