import algosdk from 'algosdk'

const apps = {
  credit_score: 758916974,
  lending_pool: 758916996,
  bnpl_credit: 758917027,
  merchant_escrow: 758917045,
}

console.log('App Addresses on Testnet:')
for (const [name, id] of Object.entries(apps)) {
  const addr = algosdk.getApplicationAddress(BigInt(id))
  console.log(`${name} (${id}): ${addr}`)
}
