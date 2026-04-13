import { NextRequest, NextResponse } from 'next/server'
import algosdk from 'algosdk'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import { deployments } from '@/lib/algorand/client'

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

    const mnemonic = process.env.FAUCET_MNEMONIC
    if (!mnemonic) return NextResponse.json({ error: 'Faucet not configured' }, { status: 500 })

    const algorand = AlgorandClient.fromEnvironment()
    const faucetAccount = algorand.account.fromMnemonic(mnemonic)

    // First: check if user is opted in to USDC
    const accountInfo = await algorand.client.algod.accountAssetInformation(address, deployments.usdc_asset_id).do().catch(() => null)

    if (!accountInfo) {
      return NextResponse.json({ error: 'Please opt-in to USDC (Asset ID: ' + deployments.usdc_asset_id + ') first' }, { status: 400 })
    }

    // Send 10,000 USDC (6 decimals)
    const amount = BigInt(10000) * BigInt(1_000_000)
    
    console.log("[IRION-DEBUG] Sending 10,000 USDC from Dispenser...")
    const result = await algorand.send.assetTransfer({
      sender: faucetAccount.addr,
      receiver: address,
      assetId: BigInt(deployments.usdc_asset_id),
      amount: amount,
    })

    console.log("[IRION-DEBUG] Faucet TX Sent:", result.txIds[0])

    return NextResponse.json({ 
      success: true, 
      tx_id: result.txIds[0], 
      amount: 10000,
      asset_id: deployments.usdc_asset_id 
    })
  } catch (err: any) {
    console.error('[IRION-DEBUG] Faucet API Internal Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
