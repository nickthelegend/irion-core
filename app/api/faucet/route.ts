import { NextRequest, NextResponse } from 'next/server'
import algosdk from 'algosdk'
import { algodClient, deployments } from '@/lib/algorand/client'

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

    const mnemonic = process.env.FAUCET_MNEMONIC
    if (!mnemonic) return NextResponse.json({ error: 'Faucet not configured' }, { status: 500 })

    const faucetAccount = algosdk.mnemonicToSecretKey(mnemonic)
    const sp = await algodClient.getTransactionParams().do()

    // 1. Send 10 ALGO (for transaction fees and MBR)
    const algoTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: faucetAccount.addr,
      to: address,
      amount: 10 * 1_000_000,
      suggestedParams: sp,
    })

    // 2. Send 100 USDC (100 * 1,000,000 microUSDC)
    const usdcTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: faucetAccount.addr,
      to: address,
      assetIndex: deployments.usdc_asset_id,
      amount: 100 * 1_000_000,
      suggestedParams: sp,
    })

    // Group and sign
    const gid = algosdk.computeGroupID([algoTxn, usdcTxn])
    algoTxn.group = gid
    usdcTxn.group = gid

    const signedAlgo = algoTxn.signTxn(faucetAccount.sk)
    const signedUsdc = usdcTxn.signTxn(faucetAccount.sk)

    const { txId } = await algodClient.sendRawTransaction([signedAlgo, signedUsdc]).do()
    await algosdk.waitForConfirmation(algodClient, txId, 4)

    return NextResponse.json({ success: true, tx_id: txId, amount_usdc: 100, amount_algo: 10 })
  } catch (err: any) {
    console.error('Faucet Error:', err)
    let message = err.message
    if (message.includes('overspend')) message = 'Faucet is out of funds'
    if (message.includes('asset')) message = 'Recipient is not opted-in to USDC'
    
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
