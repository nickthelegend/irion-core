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

    // Sync from chain
    const loanIds = await fetchUserLoans(borrower)
    
    // Clean up any database loans that are no longer in the on-chain list
    await Loan.deleteMany({ borrower_address: borrower, loan_id: { $nin: loanIds } })

    for (const id of loanIds) {
      const onChain = await fetchLoan(id)
      if (!onChain) continue

      const statusNum = Number(onChain.status ?? BigInt(0))
      const statusStr = ['active', 'completed', 'defaulted', 'disputed'][statusNum] ?? 'active'
      const principalUsdc = Number(onChain.principal ?? BigInt(0)) / 1_000_000
      const totalRepaidUsdc = Number(onChain.total_repaid ?? BigInt(0)) / 1_000_000

      if (statusStr === 'completed' || totalRepaidUsdc >= principalUsdc) {
        // If completed (repaid) or fully paid, delete it from the database to clear it
        await Loan.deleteOne({ loan_id: id })
      } else {
        await Loan.findOneAndUpdate(
          { loan_id: id },
          {
            loan_id: id,
            borrower_address: borrower,
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
      }
    }

    const loans = await Loan.find({ borrower_address: borrower }).sort({ created_at: -1 })
    return NextResponse.json(loans)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

