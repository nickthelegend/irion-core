const algosdk = require('algosdk')

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
const ALGOD_PORT = 443
const ALGOD_TOKEN = ''
const BNPL_CREDIT_APP_ID = 758917027
const LOAN_ID = 1

async function run() {
  console.log(`Fetching loan state for loan #${LOAN_ID}...`)
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
  
  // Box name: keyPrefix 'l' + Big-Endian uint64 of LOAN_ID
  const keyPrefix = Buffer.from('l')
  const keyBytes = Buffer.alloc(8)
  keyBytes.writeBigUInt64BE(BigInt(LOAN_ID))
  const boxName = Buffer.concat([keyPrefix, keyBytes])
  
  try {
    const boxResponse = await algod.getApplicationBoxByName(BNPL_CREDIT_APP_ID, boxName).do()
    const value = Buffer.from(boxResponse.value)
    console.log('Box Value (raw hex):', value.toString('hex'))
    
    // Struct layout:
    // borrower: 32 bytes (address)
    // merchant: 32 bytes (address)
    // principal: 8 bytes (uint64)
    // total_repaid: 8 bytes (uint64)
    // installment_amount: 8 bytes (uint64)
    // num_installments: 8 bytes (uint64)
    // installments_paid: 8 bytes (uint64)
    // start_round: 8 bytes (uint64)
    // next_due_round: 8 bytes (uint64)
    // status: 8 bytes (uint64)
    
    const borrower = algosdk.encodeAddress(new Uint8Array(value.subarray(0, 32)))
    const merchant = algosdk.encodeAddress(new Uint8Array(value.subarray(32, 64)))
    const principal = value.subarray(64, 72).readBigUInt64BE()
    const totalRepaid = value.subarray(72, 80).readBigUInt64BE()
    const installmentAmount = value.subarray(80, 88).readBigUInt64BE()
    const numInstallments = value.subarray(88, 96).readBigUInt64BE()
    const installmentsPaid = value.subarray(96, 104).readBigUInt64BE()
    const startRound = value.subarray(104, 112).readBigUInt64BE()
    const nextDueRound = value.subarray(112, 120).readBigUInt64BE()
    const status = value.subarray(120, 128).readBigUInt64BE()
    
    console.log({
      borrower,
      merchant,
      principal: (Number(principal) / 1_000_000) + ' USDC',
      totalRepaid: (Number(totalRepaid) / 1_000_000) + ' USDC',
      installmentAmount: (Number(installmentAmount) / 1_000_000) + ' USDC',
      numInstallments: Number(numInstallments),
      installmentsPaid: Number(installmentsPaid),
      startRound: Number(startRound),
      nextDueRound: Number(nextDueRound),
      status: Number(status), // 0: Active, 1: Completed, 2: Defaulted, 3: Disputed
    })
  } catch (err) {
    console.error('Error fetching box:', err.message ?? err)
  }
}

run().catch(console.error)
