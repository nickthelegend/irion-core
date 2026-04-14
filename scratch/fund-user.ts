import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

async function fund() {
  const algorand = AlgorandClient.defaultLocalNet()
  const dispenser = await algorand.account.localNetDispenser()
  const user = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4'
  
  console.log('Funding user:', user)
  await algorand.send.payment({
    sender: dispenser.addr,
    receiver: user,
    amount: algo(100),
  })
  console.log('Done!')
}

fund().catch(console.error)
