import { AlgorandClient } from '@algorandfoundation/algokit-utils'

async function check() {
  const algorand = AlgorandClient.defaultLocalNet()
  const appId = 1005n
  try {
    const app = await algorand.client.algod.getApplicationByID(appId).do()
    console.log('App 1005 Global State:')
    app.params['global-state']?.forEach((s: any) => {
      const key = Buffer.from(s.key, 'base64').toString()
      console.log(`${key}: ${s.value.uint}`)
    })
  } catch (e) {
    console.log('App 1005 error:', e)
  }
}

check().catch(console.error)
