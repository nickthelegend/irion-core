import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Pool } from '@/lib/db/models/pool.model'
import { fetchPoolStats } from '@/lib/algorand/readChain'
import { algodClient } from '@/lib/algorand/client'

export async function GET() {
  try {
    await connectDB()
    const stats = await fetchPoolStats()
    const status = await algodClient.status().do()
    const round = Number(status.lastRound ?? 0)

    const totalDeposits = Number(stats?.total_deposits ?? BigInt(0)) / 1_000_000
    const totalBorrowed = Number(stats?.total_borrowed ?? BigInt(0)) / 1_000_000
    const utilizationRate = totalDeposits > 0 ? (totalBorrowed / totalDeposits) * 100 : 0
    // APY = base_rate + utilization * slope (mirror contract math, in percent)
    const apy = 5 + utilizationRate * 0.08

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
