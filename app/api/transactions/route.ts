import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Transaction } from '@/lib/db/models/transaction.model'
import { indexerClient, deployments } from '@/lib/algorand/client'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const address = req.nextUrl.searchParams.get('address')
    if (!address) return NextResponse.json({ error: 'address param required' }, { status: 400 })

    let txns = await Transaction.find({ wallet_address: address }).sort({ timestamp: -1 }).limit(50)

    if (txns.length === 0) {
      // Fetch from indexer and cache
      const result = await indexerClient
        .lookupAccountTransactions(address)
        .assetID(deployments.usdc_asset_id)
        .limit(50)
        .do()

      const mapped = (result.transactions ?? []).map((tx: any) => ({
        tx_id: tx.id,
        wallet_address: address,
        type: tx['tx-type'] === 'axfer' ? 'payment' : 'deposit',
        amount_usdc: (tx['asset-transfer-transaction']?.amount ?? 0) / 1_000_000,
        loan_id: null,
        round: tx['confirmed-round'] ?? 0,
        timestamp: new Date((tx['round-time'] ?? 0) * 1000),
        status: 'confirmed' as const,
      }))

      if (mapped.length > 0) {
        await Transaction.insertMany(mapped, { ordered: false }).catch(() => {}) // ignore dup key errors
      }
      txns = await Transaction.find({ wallet_address: address }).sort({ timestamp: -1 }).limit(50)
    }

    return NextResponse.json(txns)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
