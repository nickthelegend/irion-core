import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { LendingPoolFactory } from '../lib/algorand/clients/LendingPoolClient'

async function check() {
  const algorand = AlgorandClient.defaultLocalNet()
  const appId = 1005n
  
  const factory = new LendingPoolFactory({ algorand })
  const client = factory.getAppClientById({ appId })
  
  const state = await client.state.global.getAll()
  console.log('Global State (Raw):', state)
  
  // Specifically check deposits
  if (state.totalDeposits !== undefined) {
    console.log('Total Deposits:', state.totalDeposits.toString())
  } else {
    console.log('Total Deposits key NOT FOUND')
  }
}

check().catch(console.error)
