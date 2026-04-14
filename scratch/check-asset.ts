import { AlgorandClient } from '@algorandfoundation/algokit-utils'

async function check() {
  const algorand = AlgorandClient.defaultLocalNet()
  try {
    const asset = await algorand.client.algod.getAssetByID(1024n).do()
    console.log(`Asset 1024 exists! Name: ${asset.params.name}`)
  } catch (e) {
    console.log('Asset 1024 does not exist.')
  }
}

check().catch(console.error)
