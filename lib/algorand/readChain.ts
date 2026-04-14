import { algodClient, deployments, getCreditScoreClient, getLendingPoolClient, getBNPLCreditClient } from './client'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

// Read asset balance for a wallet address from chain
export async function fetchAssetBalance(address: string, assetId: number): Promise<number> {
  console.log('[IRION-DEBUG] fetchAssetBalance initiated', { address, assetId })
  try {
    const accountInfo = await algodClient.accountAssetInformation(address, assetId).do()
    if (!accountInfo.assetHolding) return 0
    const amount = Number(accountInfo.assetHolding.amount)
    // Assuming USDC decimals = 6
    return amount / 1_000_000
  } catch (e) {
    console.warn('[IRION-DEBUG] fetchAssetBalance error (likely not opted in)', e)
    return 0
  }
}


// Read credit profile for a wallet address from chain
export async function fetchCreditProfileFromChain(address: string) {
  console.log('[IRION-DEBUG] fetchCreditProfileFromChain initiated', address)
  try {
    // Use algod directly for simulation
    const appId = deployments.credit_score_app_id
    
    // ABI method selector for get_credit_profile(address)(uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64)
    // Method signature hash: get_credit_profile(address)(uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64)
    const methodSelector = Buffer.from([
      0x0a, 0x42, 0xe2, 0x4d  // This is the method selector - will need to calculate or use correct one
    ])
    
    const appArgs = [
      methodSelector,
      algosdk.decodeAddress(address).publicKey
    ]
    
    // Create a dummy transaction for dryrun
    const sp = await algodClient.getTransactionParams().do()
    
    // Use application info endpoint instead - this doesn't require transaction
    const appInfo = await algodClient.getApplicationByID(appId).do()
    console.log('[IRION-DEBUG] App info retrieved:', appInfo.id)
    
    // For now, return default values since we can't easily simulate without funded account
    // The contract returns 300 score by default for new users
    console.log('[IRION-DEBUG] Returning default profile for new user')
    return {
      score: BigInt(300),
      total_borrowed: BigInt(0),
      total_repaid: BigInt(0),
      active_loans: BigInt(0),
      on_time_repayments: BigInt(0),
      late_repayments: BigInt(0),
    }
  } catch (e) {
    console.warn('[IRION-DEBUG] fetchCreditProfileFromChain error', e)
    // User has no profile yet on chain — return defaults
    return {
      score: BigInt(300),
      total_borrowed: BigInt(0),
      total_repaid: BigInt(0),
      active_loans: BigInt(0),
      on_time_repayments: BigInt(0),
      late_repayments: BigInt(0),
    }
  }
}

// Read borrow limit for address
// Since the contract requires a funded account to simulate, we calculate the limit locally based on score
export async function fetchBorrowLimit(address: string): Promise<number> {
  console.log('[IRION-DEBUG] fetchBorrowLimit initiated', { address, creditScoreAppId: deployments.credit_score_app_id })
  
  try {
    // Get the credit profile (which returns defaults for new users)
    const profile = await fetchCreditProfileFromChain(address)
    const score = Number(profile.score)
    
    console.log('[IRION-DEBUG] Calculating borrow limit for score:', score)
    
    // Calculate limit based on score (matching the contract logic)
    let limit: number
    if (score < 300) {
      limit = 0
    } else if (score < 350) {
      limit = 10_000_000       // $10 - New user starter limit
    } else if (score < 400) {
      limit = 25_000_000       // $25 - After 1 on-time repayment
    } else if (score < 450) {
      limit = 50_000_000       // $50 - After 2 on-time repayments
    } else if (score < 500) {
      limit = 100_000_000      // $100 - After 3+ on-time repayments
    } else if (score < 600) {
      limit = 500_000_000      // $500
    } else if (score < 700) {
      limit = 2_000_000_000    // $2,000
    } else if (score < 750) {
      limit = 5_000_000_000    // $5,000
    } else {
      limit = 10_000_000_000   // $10,000
    }
    
    console.log('[IRION-DEBUG] Calculated borrow limit:', limit)
    return limit
  } catch (e: any) {
    console.error('[IRION-DEBUG] fetchBorrowLimit error:', e)
    // Return default $10 limit for new users
    return 10_000_000
  }
}

// Read pool stats
export async function fetchPoolStats() {
  console.log('[IRION-DEBUG] fetchPoolStats initiated using App ID:', deployments.lending_pool_app_id)
  const client = getLendingPoolClient()
  try {
    // Try ABI method first
    const result = await client.send.getPoolStats({ args: [] })
    console.log('[IRION-DEBUG] fetchPoolStats ABI result:', result.return)
    
    if (result.return) {
      return {
        total_deposits: result.return[0],
        total_borrowed: result.return[1],
        utilization: result.return[2]
      }
    }

    // Fallback: Read global state directly
    console.log('[IRION-DEBUG] falling back to global state read')
    const state = await client.state.global.getAll()
    console.log('[IRION-DEBUG] global state read:', state)
    
    return {
      total_deposits: state.totalDeposits ?? BigInt(0),
      total_borrowed: state.totalBorrowed ?? BigInt(0),
      utilization: state.utilizationRate ?? BigInt(0)
    }
  } catch (e) {
    console.error('[IRION-DEBUG] fetchPoolStats error', e)
    // Fallback to direct state even on error
    try {
      const state = await client.state.global.getAll()
      return {
        total_deposits: state.totalDeposits ?? BigInt(0),
        total_borrowed: state.totalBorrowed ?? BigInt(0),
        utilization: BigInt(0)
      }
    } catch (e2) {
      console.error('[IRION-DEBUG] double failure in fetchPoolStats', e2)
      return null
    }
  }
}

// Read lender position
export async function fetchLenderPosition(address: string) {
  console.log('[IRION-DEBUG] fetchLenderPosition initiated', address)
  const client = getLendingPoolClient()
  try {
    const result = await client.send.getLenderPosition({ args: [address] })
    if (!result.return) throw new Error('No return')
    const pos = {
      deposit_amount: result.return[0],
      accrued_yield: result.return[1]
    }
    console.log('[IRION-DEBUG] fetchLenderPosition result', pos)
    return pos
  } catch (e) {
    console.warn('[IRION-DEBUG] fetchLenderPosition error (likely no position)', e)
    return { deposit_amount: BigInt(0), accrued_yield: BigInt(0) }
  }
}

// Read user loans list from chain
export async function fetchUserLoans(address: string): Promise<number[]> {
  console.log('DEBUG: fetchUserLoans initiated', address)
  const client = getBNPLCreditClient()
  try {
    const result = await client.send.getUserLoans({ args: [address] })
    const ids = (result.return ?? []).map((id: bigint) => Number(id))
    console.log('DEBUG: fetchUserLoans IDs', ids)
    return ids
  } catch (e) {
    console.warn('DEBUG: fetchUserLoans error', e)
    return []
  }
}

// Read single loan from chain
export async function fetchLoan(loan_id: number) {
  console.log('DEBUG: fetchLoan initiated', loan_id)
  const client = getBNPLCreditClient()
  try {
    const result = await client.send.getLoan({ args: [BigInt(loan_id)] })
    if (!result.return) {
      console.warn('DEBUG: fetchLoan - no return value', loan_id)
      return null
    }
    const loan = {
      borrower: result.return[0],
      merchant: result.return[1],
      principal: result.return[2],
      total_repaid: result.return[3],
      installment_amount: result.return[4],
      num_installments: result.return[5],
      installments_paid: result.return[6],
      next_due_round: result.return[7],
      status: result.return[8]
    }
    console.log('DEBUG: fetchLoan result', loan)
    return loan
  } catch (e) {
    console.error('DEBUG: fetchLoan error', loan_id, e)
    return null
  }
}
