const algosdk = require('algosdk')

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
const ALGOD_PORT = 443
const ALGOD_TOKEN = ''
const BNPL_CREDIT_APP_ID = 758917027
const USER_ADDRESS = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4'

async function run() {
  console.log(`Querying loans for user ${USER_ADDRESS}...`)
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
  
  // Read local state or boxes of application
  // The user_loans mapping is: BoxMap<Account, uint64[]>({ keyPrefix: 'u' })
  // So the box name is: 'u' (bytes) + 32 bytes public key of user address
  const keyPrefix = Buffer.from('u')
  const userPublicKey = algosdk.decodeAddress(USER_ADDRESS).publicKey
  const boxName = Buffer.concat([keyPrefix, userPublicKey])
  
  try {
    const boxResponse = await algod.getApplicationBoxByName(BNPL_CREDIT_APP_ID, boxName).do()
    const value = Buffer.from(boxResponse.value)
    console.log('User Loans Box (raw hex):', value.toString('hex'))
    
    // In Algorand TS, a uint64[] is stored in ABI layout:
    // First 2 bytes: length of array (uint16)
    // Then 8 bytes per uint64 element
    const arrayLength = value.readUInt16BE(0)
    console.log(`User has ${arrayLength} loans:`)
    for (let i = 0; i < arrayLength; i++) {
      const loanId = value.readBigUInt64BE(2 + i * 8)
      console.log(`- Loan ID: ${loanId.toString()}`)
    }
  } catch (err) {
    if (err.message && err.message.includes('404')) {
      console.log('No loans box found for user in BNPLCredit app.')
    } else {
      console.error('Error fetching box:', err.message ?? err)
    }
  }
}

run().catch(console.error)
