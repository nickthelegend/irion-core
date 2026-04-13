import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/user.model'
import { fetchCreditProfileFromChain, fetchBorrowLimit } from '@/lib/algorand/readChain'

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    await connectDB()

    let user = await User.findOne({ wallet_address: address })

    if (!user) {
      // First time seeing this address — fetch from chain and cache
      const profile: any = await fetchCreditProfileFromChain(address)
      const borrowLimit = await fetchBorrowLimit(address)

      user = await User.create({
        wallet_address: address,
        credit_score: Number(profile.score ?? BigInt(300)),
        borrow_limit: borrowLimit,
        total_borrowed: Number(profile.total_borrowed ?? BigInt(0)) / 1_000_000,
        total_repaid: Number(profile.total_repaid ?? BigInt(0)) / 1_000_000,
        active_loans: Number(profile.active_loans ?? BigInt(0)),
        on_time_repayments: Number(profile.on_time_repayments ?? BigInt(0)),
        late_repayments: Number(profile.late_repayments ?? BigInt(0)),
        last_synced_round: 0,
      })
    }

    return NextResponse.json({
      wallet_address: user.wallet_address,
      credit_score: user.credit_score,
      borrow_limit: user.borrow_limit,
      total_borrowed: user.total_borrowed,
      total_repaid: user.total_repaid,
      active_loans: user.active_loans,
      on_time_repayments: user.on_time_repayments,
      late_repayments: user.late_repayments,
    })
  } catch (err: any) {
    console.error('[GET /api/user]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
