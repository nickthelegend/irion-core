import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

async function fundAssets() {
  const algorand = AlgorandClient.defaultLocalNet()
  const dispenser = await algorand.account.localNetDispenser()
  const user = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4'
  
  // Try to find USDC (unitName USDC)
  const assets = await algorand.client.algod().searchForAssets().unitName('USDC').do()
  console.log('Found USDC-like assets:', assets.assets?.length)
  
  if (assets.assets && assets.assets.length > 0) {
    const assetId = assets.assets[0].index
    console.log('Using Asset ID:', assetId)
    
    // Fund user with USDC (needs opt-in)
    // We expect the user to opt-in via UI, but since we want it to "work nicely", 
    // we can't force the user to sign without their wallet.
    // However, I can send Algos so they can opt-in. I already did that.
    
    console.log(`To get USDC, the user must opt-in to Asset ID: ${assetId}`)
  } else {
    console.log('No USDC asset found in LocalNet. Need to deploy.')
  }
}

fundAssets().catch(console.error)
