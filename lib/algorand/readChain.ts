import { algodClient, deployments, getCreditScoreClient, getLendingPoolClient, getBNPLCreditClient } from './client'

// Read credit profile for a wallet address from chain
export async function fetchCreditProfileFromChain(address: string) {
  console.log('DEBUG: fetchCreditProfileFromChain initiated', address)
  const client = getCreditScoreClient()
  try {
    const result = await client.send.getCreditProfile({ args: [address] })
    console.log('DEBUG: fetchCreditProfileFromChain result', result.return)
    return result.return
  } catch (e) {
    console.warn('DEBUG: fetchCreditProfileFromChain error (likely no profile)', e)
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
export async function fetchBorrowLimit(address: string): Promise<number> {
  console.log('DEBUG: fetchBorrowLimit initiated', address)
  const client = getCreditScoreClient()
  try {
    const result = await client.send.getBorrowLimit({ args: [address] })
    console.log('DEBUG: fetchBorrowLimit result', result.return)
    return Number(result.return ?? BigInt(0))
  } catch (e) {
    console.warn('DEBUG: fetchBorrowLimit error', e)
    return 0
  }
}

// Read pool stats
export async function fetchPoolStats() {
  console.log('DEBUG: fetchPoolStats initiated')
  const client = getLendingPoolClient()
  try {
    const result = await client.send.getPoolStats({ args: [] })
    if (!result.return) {
      console.warn('DEBUG: fetchPoolStats - no return value')
      return null
    }
    const stats = {
      total_deposits: result.return[0],
      total_borrowed: result.return[1],
      utilization: result.return[2]
    }
    console.log('DEBUG: fetchPoolStats result', stats)
    return stats
  } catch (e) {
    console.error('DEBUG: fetchPoolStats error', e)
    return null
  }
}

// Read lender position
export async function fetchLenderPosition(address: string) {
  console.log('DEBUG: fetchLenderPosition initiated', address)
  const client = getLendingPoolClient()
  try {
    const result = await client.send.getLenderPosition({ args: [address] })
    if (!result.return) throw new Error('No return')
    const pos = { 
      deposit_amount: result.return[0], 
      accrued_yield: result.return[1] 
    }
    console.log('DEBUG: fetchLenderPosition result', pos)
    return pos
  } catch (e) {
    console.warn('DEBUG: fetchLenderPosition error (likely no position)', e)
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
