import { NextRequest, NextResponse } from 'next/server'
import algosdk from 'algosdk'

const DEPLOYER_MNEMONIC = process.env.FAUCET_MNEMONIC
const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER ?? 'http://localhost'
const ALGOD_PORT = Number(process.env.NEXT_PUBLIC_ALGOD_PORT ?? 4001)
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN ?? 'a'.repeat(64)
const IUSDC_ASSET_ID = Number(process.env.NEXT_PUBLIC_USDC_ASSET_ID ?? 0)
const FAUCET_AMOUNT = 10_000 * 1_000_000 // 10,000 iUSDC in microUnits

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address } = body

    console.log('[Faucet] Request body:', body)
    console.log('[Faucet] MNEMONIC present:', !!DEPLOYER_MNEMONIC, 'length:', DEPLOYER_MNEMONIC?.length)

    if (!address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 })
    }

    if (!DEPLOYER_MNEMONIC) {
      return NextResponse.json({ error: 'Faucet not configured (FAUCET_MNEMONIC missing)' }, { status: 500 })
    }

    // Validate Algorand address
    if (typeof address !== 'string' || !algosdk.isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid Algorand address' }, { status: 400 })
    }

    if (!IUSDC_ASSET_ID) {
      return NextResponse.json({ error: 'iUSDC asset ID not configured' }, { status: 500 })
    }

    const deployer = algosdk.mnemonicToSecretKey(DEPLOYER_MNEMONIC)
    const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
    console.log('[Faucet] Deployer address:', deployer.addr.toString())

    // Check if recipient has opted in to iUSDC
    let isOptedIn = false
    try {
      const assetInfo = await algod.accountAssetInformation(address, IUSDC_ASSET_ID).do()
      const holding = assetInfo['asset-holding'] ?? assetInfo.assetHolding
      isOptedIn = holding !== undefined
      console.log('[Faucet] Recipient opted into iUSDC:', isOptedIn)
    } catch {
      isOptedIn = false
      console.log('[Faucet] Recipient NOT opted into iUSDC')
    }

    if (!isOptedIn) {
      return NextResponse.json({
        error: 'not_opted_in',
        message: `Please opt-in to iUSDC (Asset ID: ${IUSDC_ASSET_ID}) first. Sign a 0-amount transfer to yourself.`,
        asset_id: IUSDC_ASSET_ID,
      }, { status: 400 })
    }

    // Check deployer iUSDC balance
    let deployerBalance = BigInt(0)
    try {
      const deployerAsset = await algod.accountAssetInformation(
        deployer.addr.toString(),
        IUSDC_ASSET_ID
      ).do()
      console.log('[Faucet] Deployer asset info:', deployerAsset)
      const amount = deployerAsset['asset-holding']?.amount ?? deployerAsset.assetHolding?.amount ?? deployerAsset.amount
      deployerBalance = BigInt(amount)
      console.log('[Faucet] Deployer iUSDC balance:', deployerBalance.toString(), '(' + (Number(deployerBalance) / 1_000_000).toFixed(2) + ' iUSDC)')
    } catch (e: any) {
      console.error('[Faucet] Error checking deployer balance:', e.message ?? e)
      return NextResponse.json({ error: 'Faucet has no iUSDC balance', details: e.message }, { status: 500 })
    }

    if (deployerBalance < BigInt(FAUCET_AMOUNT)) {
      return NextResponse.json({
        error: 'Faucet depleted',
        message: 'Faucet is out of iUSDC. Contact admin.',
      }, { status: 503 })
    }

    // Build and send iUSDC transfer
    const sp = await algod.getTransactionParams().do()

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: deployer.addr.toString(),
      receiver: address,
      assetIndex: IUSDC_ASSET_ID,
      amount: FAUCET_AMOUNT,
      suggestedParams: sp,
      note: new TextEncoder().encode('Irion iUSDC Faucet'),
    } as any)

    const signedTxn = txn.signTxn(deployer.sk)
    const txResponse = await algod.sendRawTransaction(signedTxn).do() as any
    const txId = txResponse.txId || txResponse.txid || (txResponse as any)['txId']

    // Wait for confirmation
    const confirmation = await algosdk.waitForConfirmation(algod, txId, 4)

    console.log(`[Faucet] Sent ${FAUCET_AMOUNT / 1_000_000} iUSDC to ${address}. TX: ${txId}`)

    return NextResponse.json({
      success: true,
      tx_id: txId,
      amount_iusdc: FAUCET_AMOUNT / 1_000_000,
      asset_id: IUSDC_ASSET_ID,
      confirmed_round: confirmation.confirmedRound ? Number(confirmation.confirmedRound) : undefined,
      explorer_url: `https://testnet.explorer.perawallet.app/transactions/${txId}`,
    })

  } catch (err: any) {
    console.error('[Faucet] Error:', err.message ?? err)
    return NextResponse.json(
      { error: err.message ?? 'Faucet transaction failed' },
      { status: 500 }
    )
  }
}
