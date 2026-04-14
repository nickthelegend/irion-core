import { NextRequest, NextResponse } from 'next/server'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { deployments } from '@/lib/algorand/client'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const address = url.searchParams.get('address')
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  try {
    console.log('[TEST-DIRECT] Testing direct contract call for:', address)
    console.log('[TEST-DIRECT] CreditScore App ID:', deployments.credit_score_app_id)
    
    // Create algod client
    const algodClient = new algosdk.Algodv2(
      process.env.NEXT_PUBLIC_ALGOD_TOKEN ?? 'a'.repeat(64),
      process.env.NEXT_PUBLIC_ALGOD_SERVER ?? 'http://localhost',
      Number(process.env.NEXT_PUBLIC_ALGOD_PORT ?? 4001)
    )
    
    // Create ABI method for get_borrow_limit
    const abiMethod = new algosdk.ABIMethod({
      name: 'get_borrow_limit',
      args: [{ type: 'address', name: 'user' }],
      returns: { type: 'uint64' }
    })
    
    console.log('[TEST-DIRECT] ABI Method:', abiMethod.getSignature())
    
    // Create application call transaction
    const sp = await algodClient.getTransactionParams().do()
    const appId = deployments.credit_score_app_id
    
    console.log('[TEST-DIRECT] Creating app call with params:', {
      appId,
      sender: address,
      method: abiMethod.getSignature()
    })
    
    // Dry run the transaction to see what happens
    const appCall = algosdk.makeApplicationNoOpTxnFromObject({
      sender: address,
      suggestedParams: sp,
      appIndex: appId,
      appArgs: [
        abiMethod.getSelector(),
        algosdk.decodeAddress(address).publicKey
      ]
    })
    
    console.log('[TEST-DIRECT] App call created, attempting dry run...')
    
    // Try to dry run
    try {
      const dr = new (algosdk as any).DryrunSource(
        'json',
        Buffer.from((appCall as any).toByte()).toString('base64')
      )
      const dryrunResult = await (algodClient.dryrun({
        txns: [dr]
      } as any) as any).do()
      console.log('[TEST-DIRECT] Dry run result:', JSON.stringify(dryrunResult, null, 2))
    } catch (dryRunError: any) {
      console.error('[TEST-DIRECT] Dry run error:', dryRunError.message)
    }
    
    return NextResponse.json({
      address,
      appId,
      method: abiMethod.getSignature(),
      selector: Buffer.from(abiMethod.getSelector()).toString('hex'),
      note: 'Check server logs for dry run results'
    })
    
  } catch (err: any) {
    console.error('[TEST-DIRECT] Error:', err)
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 })
  }
}