import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Loan } from '@/lib/db/models/loan.model'
import { fetchLoan } from '@/lib/algorand/readChain'
import { encodeAddress } from 'algosdk'

export async function GET(req: NextRequest, { params }: { params: { loan_id: string } }) {
  try {
    await connectDB()
    const id = Number(params.loan_id)
    let loan = await Loan.findOne({ loan_id: id })
    if (!loan) {
      const onChain = await fetchLoan(id)
      if (!onChain) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
      loan = await Loan.create({
        loan_id: id,
        borrower_address: onChain.borrower ? encodeAddress(onChain.borrower) : '',
        merchant_address: onChain.merchant ? encodeAddress(onChain.merchant) : '',
        principal_usdc: Number(onChain.principal ?? BigInt(0)) / 1_000_000,
        total_repaid_usdc: Number(onChain.total_repaid ?? BigInt(0)) / 1_000_000,
        installment_amount_usdc: Number(onChain.installment_amount ?? BigInt(0)) / 1_000_000,
        num_installments: Number(onChain.num_installments ?? BigInt(0)),
        installments_paid: Number(onChain.installments_paid ?? BigInt(0)),
        start_round: 0, // removed from contract return
        next_due_round: Number(onChain.next_due_round ?? BigInt(0)),
        status: ['active', 'completed', 'defaulted', 'disputed'][Number(onChain.status ?? BigInt(0))] ?? 'active',
      })
    }
    return NextResponse.json(loan)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
