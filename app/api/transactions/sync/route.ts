import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Transaction } from '@/lib/db/models/transaction.model'
import { User } from '@/lib/db/models/user.model'
import { indexerClient, deployments } from '@/lib/algorand/client'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { address } = await req.json()
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

    const user = await User.findOne({ wallet_address: address })
    const minRound = user?.last_synced_round ?? 0

    const result = await indexerClient
      .lookupAccountTransactions(address)
      .assetID(deployments.usdc_asset_id)
      .minRound(minRound)
      .limit(100)
      .do()

    const mapped = (result.transactions ?? []).map((tx: any) => ({
      tx_id: tx.id,
      wallet_address: address,
      type: 'payment' as const,
      amount_usdc: (tx['asset-transfer-transaction']?.amount ?? 0) / 1_000_000,
      loan_id: null,
      round: tx['confirmed-round'] ?? 0,
      timestamp: new Date((tx['round-time'] ?? 0) * 1000),
      status: 'confirmed' as const,
    }))

    let count = 0
    for (const t of mapped) {
      try {
        await Transaction.create(t)
        count++
      } catch {} // skip duplicates
    }

    // Update last synced round
    if (result.transactions?.length > 0) {
      const maxRound = Math.max(...mapped.map((t: any) => t.round))
      await User.findOneAndUpdate({ wallet_address: address }, { last_synced_round: maxRound })
    }

    return NextResponse.json({ synced: count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
