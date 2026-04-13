'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import * as algokit from '@algorandfoundation/algokit-utils'
import { deployments } from '@/lib/algorand/client'

// Import generated client factories
import { LendingPoolFactory } from '../algorand/clients/LendingPoolClient'
import { BnplCreditFactory } from '../algorand/clients/BNPLCreditClient'

function getAlgorandClient(activeAddress: string, transactionSigner: any) {
  return AlgorandClient.fromClients({
    algod: new algosdk.Algodv2(
      process.env.NEXT_PUBLIC_ALGOD_TOKEN ?? 'a'.repeat(64),
      process.env.NEXT_PUBLIC_ALGOD_SERVER ?? 'http://localhost',
      Number(process.env.NEXT_PUBLIC_ALGOD_PORT ?? 4001)
    ),
  }).setSigner(activeAddress, transactionSigner)
}

export function useDepositToPool() {
  const { activeAddress, transactionSigner } = useWallet()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ amount_usdc }: { amount_usdc: number }) => {
      console.log('DEBUG: useDepositToPool initiated', { amount_usdc, activeAddress })
      if (!activeAddress || !transactionSigner) throw new Error('Wallet not connected')

      const algorand = getAlgorandClient(activeAddress, transactionSigner)
      const factory = new LendingPoolFactory({ algorand, defaultSender: activeAddress })
      const client = factory.getAppClientById({ appId: BigInt(deployments.lending_pool_app_id) })

      // Build atomic group: USDC payment + deposit call
      const amountMicro = BigInt(Math.floor(amount_usdc * 1_000_000))
      console.log('DEBUG: useDepositToPool - calculated amountMicro', amountMicro.toString())
      const sp = await algorand.client.algod.getTransactionParams().do()

      const paymentTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: algosdk.getApplicationAddress(deployments.lending_pool_app_id),
        assetIndex: deployments.usdc_asset_id,
        amount: amountMicro,
        suggestedParams: sp,
      })

      console.log('DEBUG: useDepositToPool - sending transaction group...')
      const result = await client.send.deposit({
        args: [{ txn: paymentTxn, signer: transactionSigner }],
        extraFee: (algokit.microAlgos(2000) as any),
      })

      console.log('DEBUG: useDepositToPool - success', result.txIds[0])
      return result.txIds[0]
    },
    onSuccess: () => {
      console.log('DEBUG: useDepositToPool - onSuccess - invalidating queries')
      qc.invalidateQueries({ queryKey: ['pool-stats'] })
      qc.invalidateQueries({ queryKey: ['lender-position', activeAddress] })
      if (activeAddress) {
        fetch(`/api/user/${activeAddress}/sync`, { method: 'POST' })
          .then(() => console.log('DEBUG: useDepositToPool - sync triggered'))
          .catch(e => console.error('DEBUG: useDepositToPool - sync failed', e))
      }
    },
    onError: (e) => {
      console.error('DEBUG: useDepositToPool - mutation error', e)
    }
  })
}

export function useInitiateLoan() {
  const { activeAddress, transactionSigner } = useWallet()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      merchant,
      amount_usdc,
      num_installments,
    }: {
      merchant: string
      amount_usdc: number
      num_installments: number
    }) => {
      console.log('DEBUG: useInitiateLoan initiated', { merchant, amount_usdc, num_installments, activeAddress })
      if (!activeAddress || !transactionSigner) throw new Error('Wallet not connected')

      const algorand = getAlgorandClient(activeAddress, transactionSigner)
      const factory = new BnplCreditFactory({ algorand, defaultSender: activeAddress })
      const client = factory.getAppClientById({ appId: BigInt(deployments.bnpl_credit_app_id) })

      const amountMicro = BigInt(Math.floor(amount_usdc * 1_000_000))
      console.log('DEBUG: useInitiateLoan - amountMicro', amountMicro.toString())

      console.log('DEBUG: useInitiateLoan - sending transaction...')
      const result = await client.send.initiateLoan({
        args: [merchant, amountMicro, BigInt(num_installments)],
        extraFee: (algokit.microAlgos(5000) as any), // cross-contract calls need extra fee
      })

      console.log('DEBUG: useInitiateLoan - success', { txId: result.txIds[0], loanId: Number(result.return ?? BigInt(0)) })
      return { txId: result.txIds[0], loanId: Number(result.return ?? BigInt(0)) }
    },
    onSuccess: () => {
      console.log('DEBUG: useInitiateLoan - onSuccess - invalidating queries')
      qc.invalidateQueries({ queryKey: ['loans', activeAddress] })
      qc.invalidateQueries({ queryKey: ['user', activeAddress] })
    },
    onError: (e) => {
      console.error('DEBUG: useInitiateLoan - mutation error', e)
    }
  })
}

export function useMakePayment() {
  const { activeAddress, transactionSigner } = useWallet()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ loan_id, amount_usdc }: { loan_id: number; amount_usdc: number }) => {
      console.log('DEBUG: useMakePayment initiated', { loan_id, amount_usdc, activeAddress })
      if (!activeAddress || !transactionSigner) throw new Error('Wallet not connected')

      const algorand = getAlgorandClient(activeAddress, transactionSigner)
      const factory = new BnplCreditFactory({ algorand, defaultSender: activeAddress })
      const client = factory.getAppClientById({ appId: BigInt(deployments.bnpl_credit_app_id) })

      const amountMicro = BigInt(Math.floor(amount_usdc * 1_000_000))
      console.log('DEBUG: useMakePayment - amountMicro', amountMicro.toString())
      const sp = await algorand.client.algod.getTransactionParams().do()

      const paymentTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: algosdk.getApplicationAddress(deployments.bnpl_credit_app_id),
        assetIndex: deployments.usdc_asset_id,
        amount: amountMicro,
        suggestedParams: sp,
      })

      console.log('DEBUG: useMakePayment - sending transaction...')
      const result = await client.send.makePayment({
        args: [BigInt(loan_id), { txn: paymentTxn, signer: transactionSigner }],
        extraFee: (algokit.microAlgos(4000) as any),
      })

      console.log('DEBUG: useMakePayment - success', result.txIds[0])
      return result.txIds[0]
    },
    onSuccess: (_, { loan_id }) => {
      console.log('DEBUG: useMakePayment - onSuccess - invalidating queries')
      qc.invalidateQueries({ queryKey: ['loan', loan_id] })
      qc.invalidateQueries({ queryKey: ['loans', activeAddress] })
      qc.invalidateQueries({ queryKey: ['user', activeAddress] })
      if (activeAddress) {
        fetch(`/api/user/${activeAddress}/sync`, { method: 'POST' })
          .then(() => console.log('DEBUG: useMakePayment - sync triggered'))
          .catch(e => console.error('DEBUG: useMakePayment - sync failed', e))
      }
    },
    onError: (e) => {
      console.error('DEBUG: useMakePayment - mutation error', e)
    }
  })
}

export function useWithdrawFromPool() {
  const { activeAddress, transactionSigner } = useWallet()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ lp_amount }: { lp_amount: number }) => {
      console.log('DEBUG: useWithdrawFromPool initiated', { lp_amount, activeAddress })
      if (!activeAddress || !transactionSigner) throw new Error('Wallet not connected')

      const algorand = getAlgorandClient(activeAddress, transactionSigner)
      const factory = new LendingPoolFactory({ algorand, defaultSender: activeAddress })
      const client = factory.getAppClientById({ appId: BigInt(deployments.lending_pool_app_id) })

      const lpAmountMicro = BigInt(Math.floor(lp_amount * 1_000_000))
      console.log('DEBUG: useWithdrawFromPool - lpAmountMicro', lpAmountMicro.toString())

      console.log('DEBUG: useWithdrawFromPool - sending transaction...')
      const result = await client.send.withdraw({
        args: [lpAmountMicro],
        extraFee: (algokit.microAlgos(3000) as any),
      })

      console.log('DEBUG: useWithdrawFromPool - success', result.txIds[0])
      return result.txIds[0]
    },
    onSuccess: () => {
      console.log('DEBUG: useWithdrawFromPool - onSuccess - invalidating queries')
      qc.invalidateQueries({ queryKey: ['pool-stats'] })
      qc.invalidateQueries({ queryKey: ['lender-position', activeAddress] })
    },
    onError: (e) => {
      console.error('DEBUG: useWithdrawFromPool - mutation error', e)
    }
  })
}
