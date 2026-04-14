import algosdk from 'algosdk'
import { AlgorandClient, algo, microAlgo } from '@algorandfoundation/algokit-utils'
import fs from 'fs'

import { CreditScoreFactory } from 'd:/Project/irion/irion-contracts/projects/irion-contracts/smart_contracts/artifacts/credit_score/CreditScoreClient'
import { LendingPoolFactory } from 'd:/Project/irion/irion-contracts/projects/irion-contracts/smart_contracts/artifacts/lending_pool/LendingPoolClient'
import { BnplCreditFactory } from 'd:/Project/irion/irion-contracts/projects/irion-contracts/smart_contracts/artifacts/bnpl_credit/BNPLCreditClient'
import { MerchantEscrowFactory } from 'd:/Project/irion/irion-contracts/projects/irion-contracts/smart_contracts/artifacts/merchant_escrow/MerchantEscrowClient'

async function deploy() {
  const algorand = AlgorandClient.defaultLocalNet()
  const dispenser = await algorand.account.localNetDispenser()
  algorand.setDefaultSigner(dispenser.signer)

  console.log('Deployer:', dispenser.addr.toString())

  // USDC
  console.log('Creating USDC...')
  const usdc = await algorand.send.assetCreate({
    sender: dispenser.addr.toString(),
    total: 1_000_000_000_000_000n,
    decimals: 6,
    assetName: 'USD Coin (Mock)',
    unitName: 'USDC',
  })
  const usdcId = BigInt(usdc.confirmation.assetIndex!)
  console.log('USDC ID:', usdcId.toString())

  // Deploy CreditScore
  console.log('Deploying CreditScore...')
  const csFactory = algorand.client.getTypedAppFactory(CreditScoreFactory)
  const { appClient: csClient } = await csFactory.send.create.create()
  await algorand.send.payment({ sender: dispenser.addr.toString(), receiver: csClient.appAddress, amount: algo(0.5) })
  await csClient.send.bootstrap({ args: [] })
  console.log('CreditScore ID:', csClient.appId.toString())

  // Deploy LendingPool
  console.log('Deploying LendingPool...')
  const lpFactory = algorand.client.getTypedAppFactory(LendingPoolFactory)
  const { appClient: lpClient } = await lpFactory.send.create.create()
  await algorand.send.payment({ sender: dispenser.addr.toString(), receiver: lpClient.appAddress, amount: algo(2) })
  await lpClient.send.bootstrap({ args: [usdcId], extraFee: microAlgo(3000) })
  console.log('LendingPool ID:', lpClient.appId.toString())

  // Link
  await lpClient.send.setCreditScoreApp({ args: [csClient.appId] })
  await csClient.send.setLendingPoolApp({ args: [lpClient.appId] })

  // Deploy BNPLCredit
  console.log('Deploying BNPLCredit...')
  const bnplFactory = algorand.client.getTypedAppFactory(BnplCreditFactory)
  const { appClient: bnplClient } = await bnplFactory.send.create.create()
  await algorand.send.payment({ sender: dispenser.addr.toString(), receiver: bnplClient.appAddress, amount: algo(0.5) })
  await bnplClient.send.bootstrap({ args: [csClient.appId, lpClient.appId] })
  console.log('BNPLCredit ID:', bnplClient.appId.toString())

  // Deploy MerchantEscrow
  console.log('Deploying MerchantEscrow...')
  const meFactory = algorand.client.getTypedAppFactory(MerchantEscrowFactory)
  const { appClient: meClient } = await meFactory.send.create.create()
  await algorand.send.payment({ sender: dispenser.addr.toString(), receiver: meClient.appAddress, amount: algo(1) })
  await meClient.send.bootstrap({ args: [bnplClient.appId, usdcId], extraFee: microAlgo(1000) })
  console.log('MerchantEscrow ID:', meClient.appId.toString())

  const deployments = {
    network: 'localnet',
    deployed_at: new Date().toISOString(),
    usdc_asset_id: Number(usdcId),
    credit_score_app_id: Number(csClient.appId),
    lending_pool_app_id: Number(lpClient.appId),
    bnpl_credit_app_id: Number(bnplClient.appId),
    merchant_escrow_app_id: Number(meClient.appId),
  }

  // Write to both places to be safe
  fs.writeFileSync('d:/Project/irion/irion-contracts/deployments.json', JSON.stringify(deployments, null, 2))
  fs.writeFileSync('d:/Project/irion/irion-core/deployments.local.json', JSON.stringify(deployments, null, 2))
  console.log('Deployments saved!')

  // FUND USER
  const user = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4'
  console.log('Funding user:', user)
  await algorand.send.payment({ sender: dispenser.addr.toString(), receiver: user, amount: algo(100) })
  console.log('User funded with 100 ALGO')
}

deploy().catch(console.error)
