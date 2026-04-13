import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/user.model'
import { fetchCreditProfileFromChain, fetchBorrowLimit } from '@/lib/algorand/readChain'

export async function POST(req: NextRequest, { params }: { params: { address: string } }) {
  try {
    await connectDB()
    const { address } = params

    const profile: any = await fetchCreditProfileFromChain(address)
    const borrowLimit = await fetchBorrowLimit(address)

    if (!profile) throw new Error('Could not fetch profile')

    const updated = await User.findOneAndUpdate(
      { wallet_address: address },
      {
        credit_score: Number(profile.score ?? BigInt(300)),
        borrow_limit: borrowLimit,
        total_borrowed: Number(profile.total_borrowed ?? BigInt(0)) / 1_000_000,
        total_repaid: Number(profile.total_repaid ?? BigInt(0)) / 1_000_000,
        active_loans: Number(profile.active_loans ?? BigInt(0)),
        on_time_repayments: Number(profile.on_time_repayments ?? BigInt(0)),
        late_repayments: Number((profile as any).late_repayments ?? BigInt(0)),
        last_synced_round: Date.now(),
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, user: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
