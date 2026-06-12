const algosdk = require('algosdk')

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
const ALGOD_PORT = 443
const ALGOD_TOKEN = ''
const BNPL_CREDIT_APP_ID = 758917027

async function run() {
  console.log(`Querying global state for BNPLCredit app ${BNPL_CREDIT_APP_ID}...`)
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
  
  try {
    const appInfo = await algod.getApplicationByID(BNPL_CREDIT_APP_ID).do()
    const globalState = appInfo.params['global-state']
    
    console.log('Global State keys:')
    if (!globalState) {
      console.log('No global state found.')
      return
    }
    
    for (const item of globalState) {
      const key = Buffer.from(item.key, 'base64').toString('ascii')
      const value = item.value
      
      if (value.type === 1) { // bytes
        console.log(`- ${key}: ${Buffer.from(value.bytes, 'base64').toString('hex')}`)
      } else if (value.type === 2) { // uint
        console.log(`- ${key}: ${value.uint.toString()}`)
      }
    }
  } catch (err) {
    console.error('Error:', err.message ?? err)
  }
}

run().catch(console.error)
