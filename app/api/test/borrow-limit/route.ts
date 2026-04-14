import { NextRequest, NextResponse } from 'next/server'
import { fetchBorrowLimit, fetchCreditProfileFromChain } from '@/lib/algorand/readChain'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const address = url.searchParams.get('address')
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  try {
    console.log('[TEST] Testing borrow limit for:', address)
    
    // Test both functions
    const profile = await fetchCreditProfileFromChain(address)
    const borrowLimit = await fetchBorrowLimit(address)
    
    console.log('[TEST] Results:', {
      address,
      score: profile?.score?.toString(),
      borrowLimit,
      total_borrowed: profile?.total_borrowed?.toString(),
      total_repaid: profile?.total_repaid?.toString(),
    })
    
    return NextResponse.json({
      address,
      score: profile?.score?.toString(),
      borrowLimit,
      rawProfile: {
        score: profile?.score?.toString(),
        total_borrowed: profile?.total_borrowed?.toString(),
        total_repaid: profile?.total_repaid?.toString(),
        active_loans: profile?.active_loans?.toString(),
        on_time_repayments: profile?.on_time_repayments?.toString(),
        late_repayments: profile?.late_repayments?.toString(),
      }
    })
  } catch (err: any) {
    console.error('[TEST] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}