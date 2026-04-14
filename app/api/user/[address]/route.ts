import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/user.model'
import { fetchCreditProfileFromChain, fetchBorrowLimit } from '@/lib/algorand/readChain'

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === 'true'
    
    console.log('[API /user] Fetching profile for:', address, 'force:', force)
    await connectDB()

    // Check if user exists
    let user = await User.findOne({ wallet_address: address })
    console.log('[API /user] Existing user in DB:', user ? 'YES' : 'NO')
    
    if (user) {
      console.log('[API /user] Current DB values:', {
        credit_score: user.credit_score,
        borrow_limit: user.borrow_limit
      })
    }

    // ALWAYS fetch fresh data from chain to ensure accuracy
    console.log('[API /user] Fetching from chain...')
    const profile: any = await fetchCreditProfileFromChain(address)
    const borrowLimitMicro = await fetchBorrowLimit(address)
    const borrowLimit = borrowLimitMicro / 1_000_000  // Convert micro-USDC to USDC
    
    console.log('[API /user] Chain data:', { 
      score: profile.score?.toString(), 
      borrowLimitMicro,
      borrowLimit,
      total_borrowed: profile.total_borrowed?.toString(),
      total_repaid: profile.total_repaid?.toString()
    })

    // Update or create user in DB with fresh data
    const updatedUser = await User.findOneAndUpdate(
      { wallet_address: address },
      {
        credit_score: Number(profile.score ?? BigInt(300)),
        borrow_limit: borrowLimit,
        total_borrowed: Number(profile.total_borrowed ?? BigInt(0)) / 1_000_000,
        total_repaid: Number(profile.total_repaid ?? BigInt(0)) / 1_000_000,
        active_loans: Number(profile.active_loans ?? BigInt(0)),
        on_time_repayments: Number(profile.on_time_repayments ?? BigInt(0)),
        late_repayments: Number(profile.late_repayments ?? BigInt(0)),
        last_synced_round: Date.now(),
      },
      { upsert: true, new: true }
    )

    console.log('[API /user] Updated/created user in DB:', {
      credit_score: updatedUser.credit_score,
      borrow_limit: updatedUser.borrow_limit
    })

    return NextResponse.json({
      wallet_address: updatedUser.wallet_address,
      credit_score: updatedUser.credit_score,
      borrow_limit: updatedUser.borrow_limit,
      total_borrowed: updatedUser.total_borrowed,
      total_repaid: updatedUser.total_repaid,
      active_loans: updatedUser.active_loans,
      on_time_repayments: updatedUser.on_time_repayments,
      late_repayments: updatedUser.late_repayments,
    })
  } catch (err: any) {
    console.error('[API /user] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
