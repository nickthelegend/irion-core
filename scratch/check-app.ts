import { AlgorandClient } from '@algorandfoundation/algokit-utils'

async function check() {
  const algorand = AlgorandClient.defaultLocalNet()
  try {
    const app = await algorand.client.algod.getApplicationByID(1028n).do()
    console.log('App 1028 exists!')
  } catch (e) {
    console.log('App 1028 does not exist.')
  }
}

check().catch(console.error)
