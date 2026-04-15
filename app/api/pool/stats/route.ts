import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Pool } from '@/lib/db/models/pool.model'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    
    // Fetch the latest pool stats directly from MongoDB for speed
    const latestStat = await Pool.findOne().sort({ timestamp: -1 })
    
    if (latestStat) {
      return NextResponse.json({
        total_deposits: latestStat.total_deposits_usdc,
        total_borrowed: latestStat.total_borrowed_usdc,
        utilization_rate: latestStat.utilization_rate,
        apy: latestStat.apy
      })
    }
    
    // If no stats in DB, return 0
    return NextResponse.json({
        total_deposits: 0,
        total_borrowed: 0,
        utilization_rate: 0,
        apy: 5
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
