import { AlgorandClient } from '@algorandfoundation/algokit-utils'

async function check() {
  const algorand = AlgorandClient.defaultLocalNet()
  const addr = 'S6MCEVCQXBA55VQLVF4PST7L7FDKSR2FB23X323EBESYGOI4K7EMWFTBHM'
  try {
    const info = await algorand.client.algod.accountAssetInformation(addr, 1024n).do()
    console.log(`Dispenser has Asset 1024! Amount: ${info.assetHolding.amount}`)
  } catch (e) {
    console.log('Dispenser does NOT have Asset 1024.')
  }
}

check().catch(console.error)
