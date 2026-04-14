import { NextRequest, NextResponse } from 'next/server'
import algosdk from 'algosdk'
import { deployments } from '@/lib/algorand/client'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const address = url.searchParams.get('address')
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  try {
    console.log('[TEST-RAW] Testing raw contract call for:', address)
    console.log('[TEST-RAW] CreditScore App ID:', deployments.credit_score_app_id)
    
    // Create algod client
    const algodClient = new algosdk.Algodv2(
      process.env.NEXT_PUBLIC_ALGOD_TOKEN ?? 'a'.repeat(64),
      process.env.NEXT_PUBLIC_ALGOD_SERVER ?? 'http://localhost',
      Number(process.env.NEXT_PUBLIC_ALGOD_PORT ?? 4001)
    )
    
    // First, let's try to get the application info
    console.log('[TEST-RAW] Fetching application info...')
    const appInfo = await algodClient.getApplicationByID(deployments.credit_score_app_id).do()
    console.log('[TEST-RAW] App info:', JSON.stringify(appInfo, null, 2))
    
    // Create ABI method for get_borrow_limit
    const abiMethod = new algosdk.ABIMethod({
      name: 'get_borrow_limit',
      args: [{ type: 'address', name: 'user' }],
      returns: { type: 'uint64' }
    })
    
    const selector = abiMethod.getSelector()
    console.log('[TEST-RAW] Method selector:', Buffer.from(selector).toString('hex'))
    
    // Try to call using simulate
    console.log('[TEST-RAW] Attempting simulate call...')
    const atc = new algosdk.AtomicTransactionComposer()
    const sp = await algodClient.getTransactionParams().do()
    
    // Create a signer that just returns empty - we're simulating
    const dummySigner = async (group: algosdk.Transaction[]) => group.map(() => new Uint8Array(0))
    
    atc.addMethodCall({
      appID: deployments.credit_score_app_id,
      method: abiMethod,
      methodArgs: [address],
      sender: address,
      suggestedParams: sp,
      signer: dummySigner
    })
    
    const result = await atc.simulate(algodClient)
    console.log('[TEST-RAW] Simulate result:', JSON.stringify(result, (key, value) => {
      if (typeof value === 'bigint') return value.toString()
      return value
    }, 2))
    
    return NextResponse.json({
      appId: deployments.credit_score_app_id,
      methodSelector: Buffer.from(selector).toString('hex'),
      simulateResult: result,
      appInfo: {
        id: appInfo.id,
        params: appInfo.params
      }
    })
    
  } catch (err: any) {
    console.error('[TEST-RAW] Error:', err)
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack,
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
    }, { status: 500 })
  }
}