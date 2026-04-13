import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Loan } from '@/lib/db/models/loan.model'
import { fetchUserLoans, fetchLoan } from '@/lib/algorand/readChain'
import { encodeAddress } from 'algosdk'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const borrower = req.nextUrl.searchParams.get('borrower')
    const merchant = req.nextUrl.searchParams.get('merchant')
    
    if (merchant) {
      const loans = await Loan.find({ merchant_address: merchant }).sort({ created_at: -1 })
      return NextResponse.json(loans)
    }

    if (!borrower) return NextResponse.json({ error: 'borrower param required' }, { status: 400 })

    let loans = await Loan.find({ borrower_address: borrower }).sort({ created_at: -1 })

    if (loans.length === 0) {
      // Sync from chain
      const loanIds = await fetchUserLoans(borrower)
      for (const id of loanIds) {
        const onChain = await fetchLoan(id)
        if (!onChain) continue
        await Loan.findOneAndUpdate(
          { loan_id: id },
          {
            loan_id: id,
            borrower_address: borrower,
            merchant_address: onChain.merchant ? encodeAddress(onChain.merchant) : '',
            principal_usdc: Number(onChain.principal ?? BigInt(0)) / 1_000_000,
            total_repaid_usdc: Number(onChain.total_repaid ?? BigInt(0)) / 1_000_000,
            installment_amount_usdc: Number(onChain.installment_amount ?? BigInt(0)) / 1_000_000,
            num_installments: Number(onChain.num_installments ?? BigInt(0)),
            installments_paid: Number(onChain.installments_paid ?? BigInt(0)),
            start_round: Number(BigInt(0)), // start_round removed from contract return
            next_due_round: Number(onChain.next_due_round ?? BigInt(0)),
            status: ['active', 'completed', 'defaulted', 'disputed'][Number(onChain.status ?? BigInt(0))] ?? 'active',
          },
          { upsert: true, new: true }
        )
      }
      loans = await Loan.find({ borrower_address: borrower }).sort({ created_at: -1 })
    }

    return NextResponse.json(loans)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
