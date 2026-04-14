import { AlgorandClient } from '@algorandfoundation/algokit-utils'

async function superFaucet() {
  const algorand = AlgorandClient.defaultLocalNet()
  const dispenser = await algorand.account.localNetDispenser()
  const user = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4'
  const assetId = 1024n
  const amount = 1_000_000n * 1_000_000n // 1M USDC (6 decimals)

  console.log(`Sending ${amount / 1_000_000n} iUSDC to ${user}...`)

  try {
    const result = await algorand.send.assetTransfer({
      sender: dispenser.addr,
      receiver: user,
      assetId: assetId,
      amount: amount,
    })
    console.log('Success! Tx ID:', result.txId)
  } catch (e: any) {
    if (e.message.includes('must optin')) {
      console.error('ERROR: The user MUST opt-in to Asset 1024 first!')
    } else {
      console.error('ERROR:', e.message)
    }
  }
}

superFaucet().catch(console.error)
