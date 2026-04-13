import { NextRequest, NextResponse } from 'next/server'
import { fetchLenderPosition } from '@/lib/algorand/readChain'

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    const pos = await fetchLenderPosition(address)
    return NextResponse.json({
      deposit_amount: Number(pos?.deposit_amount ?? BigInt(0)) / 1_000_000,
      accrued_yield: Number(pos?.accrued_yield ?? BigInt(0)) / 1_000_000,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
