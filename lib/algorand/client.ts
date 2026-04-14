import algosdk from 'algosdk'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER ?? 'http://localhost'
const ALGOD_PORT = Number(process.env.NEXT_PUBLIC_ALGOD_PORT ?? 4001)
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN ?? ''
const INDEXER_SERVER = process.env.NEXT_PUBLIC_INDEXER_SERVER ?? 'http://localhost'
const INDEXER_PORT = Number(process.env.NEXT_PUBLIC_INDEXER_PORT ?? 8980)

// Algonode public nodes use empty string token with port 443
export const algodClient = new algosdk.Algodv2(
  ALGOD_TOKEN,
  ALGOD_SERVER,
  ALGOD_PORT
)

export const indexerClient = new algosdk.Indexer(
  '',  // indexer always uses empty token on public nodes
  INDEXER_SERVER,
  INDEXER_PORT
)

export const deployments = {
  usdc_asset_id: Number(process.env.NEXT_PUBLIC_USDC_ASSET_ID ?? 758795478),
  credit_score_app_id: Number(process.env.NEXT_PUBLIC_CREDIT_SCORE_APP_ID ?? 758795481),
  lending_pool_app_id: Number(process.env.NEXT_PUBLIC_LENDING_POOL_APP_ID ?? 758795495),
  bnpl_credit_app_id: Number(process.env.NEXT_PUBLIC_BNPL_CREDIT_APP_ID ?? 758795511),
  merchant_escrow_app_id: Number(process.env.NEXT_PUBLIC_MERCHANT_ESCROW_APP_ID ?? 758795523),
}

import { CreditScoreFactory } from './clients/CreditScoreClient'
import { LendingPoolFactory } from './clients/LendingPoolClient'
import { BnplCreditFactory } from './clients/BNPLCreditClient'
import { MerchantEscrowFactory } from './clients/MerchantEscrowClient'

const DUMMY_SENDER = 'S6MCEVCQXBA55VQLVF4PST7L7FDKSR2FB23X323EBESYGOI4K7EMWFTBHM' // LocalNet Dispenser Address

export function getCreditScoreClient(sender?: string) {
  const algorand = AlgorandClient.fromClients({ algod: algodClient })
  return new CreditScoreFactory({ algorand, defaultSender: sender ?? DUMMY_SENDER }).getAppClientById({ appId: BigInt(deployments.credit_score_app_id) })
}

export function getLendingPoolClient(sender?: string) {
  const algorand = AlgorandClient.fromClients({ algod: algodClient })
  return new LendingPoolFactory({ algorand, defaultSender: sender ?? DUMMY_SENDER }).getAppClientById({ appId: BigInt(deployments.lending_pool_app_id) })
}

export function getBNPLCreditClient(sender?: string) {
  const algorand = AlgorandClient.fromClients({ algod: algodClient })
  return new BnplCreditFactory({ algorand, defaultSender: sender ?? DUMMY_SENDER }).getAppClientById({ appId: BigInt(deployments.bnpl_credit_app_id) })
}

export function getMerchantEscrowClient(sender?: string) {
  const algorand = AlgorandClient.fromClients({ algod: algodClient })
  return new MerchantEscrowFactory({ algorand, defaultSender: sender ?? DUMMY_SENDER }).getAppClientById({ appId: BigInt(deployments.merchant_escrow_app_id) })
}
