import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Pool } from '@/lib/db/models/pool.model'
import { fetchPoolStats } from '@/lib/algorand/readChain'
import { algodClient } from '@/lib/algorand/client'

export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    console.log('[API] Fetching pool stats...')
    await connectDB()
    const stats = await fetchPoolStats()
    console.log('[API] Raw pool stats from chain:', stats)

    const rawDeposits = stats?.total_deposits ?? BigInt(0)
    const rawBorrowed = stats?.total_borrowed ?? BigInt(0)
    console.log('[API] Raw BigInt values:', { rawDeposits: rawDeposits.toString(), rawBorrowed: rawBorrowed.toString() })

    const totalDeposits = Number(rawDeposits) / 1_000_000
    const totalBorrowed = Number(rawBorrowed) / 1_000_000
    console.log('[API] Calculated deposits:', totalDeposits, 'borrowed:', totalBorrowed)
    const utilizationRate = totalDeposits > 0 ? (totalBorrowed / totalDeposits) * 100 : 0
    // APY = base_rate + utilization * slope (mirror contract math, in percent)
    const apy = 5 + utilizationRate * 0.08

    const status = await algodClient.status().do()
    const round = Number(status.lastRound ?? 0)

    await Pool.create({
      snapshot_round: round,
      total_deposits_usdc: totalDeposits,
      total_borrowed_usdc: totalBorrowed,
      utilization_rate: utilizationRate,
      apy: apy,
    })

    return NextResponse.json({ total_deposits: totalDeposits, total_borrowed: totalBorrowed, utilization_rate: utilizationRate, apy })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
