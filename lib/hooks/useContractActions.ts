'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import * as algokit from '@algorandfoundation/algokit-utils'
import { deployments } from '@/lib/algorand/client'

import { LendingPoolFactory } from '../algorand/clients/LendingPoolClient'
import { BnplCreditFactory } from '../algorand/clients/BNPLCreditClient'

function getAlgorandClient(activeAddress: string, transactionSigner: any) {
  console.log('DEBUG: getAlgorandClient - connecting to algod', {
    server: process.env.NEXT_PUBLIC_ALGOD_SERVER,
    port: process.env.NEXT_PUBLIC_ALGOD_PORT,
  })
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

      const amountMicro = BigInt(Math.floor(amount_usdc * 1_000_000))
      console.log('DEBUG: useDepositToPool - calculated amountMicro', amountMicro.toString())

      const globalState = await client.state.global.getAll()
      const lpTokenId = globalState.lpTokenId
      console.log('DEBUG: useDepositToPool - LP Token ID detected:', lpTokenId?.toString())
      console.log('DEBUG: useDepositToPool - USDC Asset ID:', deployments.usdc_asset_id)
      console.log('DEBUG: useDepositToPool - LendingPool App ID:', deployments.lending_pool_app_id)
      console.log('DEBUG: useDepositToPool - LendingPool Address:', algosdk.getApplicationAddress(deployments.lending_pool_app_id))

      const sp = await algorand.client.algod.getTransactionParams().do()
      console.log('DEBUG: useDepositToPool - got suggested params, firstValid:', sp.firstValid, 'lastValid:', sp.lastValid)

      const composer = client.newGroup()
      let groupSize = 0

      // Check if user is opted into USDC
      console.log('DEBUG: useDepositToPool - checking USDC opt-in for address:', activeAddress)
      try {
        await algorand.client.algod.accountAssetInformation(activeAddress, BigInt(deployments.usdc_asset_id)).do()
        console.log('DEBUG: useDepositToPool - user already opted into USDC')
      } catch (e) {
        console.log('DEBUG: useDepositToPool - user NOT opted into USDC, adding opt-in txn...')
        composer.addTransaction(
          algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            sender: activeAddress,
            receiver: activeAddress,
            assetIndex: deployments.usdc_asset_id,
            amount: 0,
            suggestedParams: sp,
          }),
          transactionSigner
        )
        groupSize++
      }

      // Check if user is opted into LP token
      if (lpTokenId) {
        console.log('DEBUG: useDepositToPool - checking LP token opt-in for LP token ID:', lpTokenId.toString())
        try {
          await algorand.client.algod.accountAssetInformation(activeAddress, lpTokenId).do()
          console.log('DEBUG: useDepositToPool - user already opted into LP token')
        } catch (e) {
          console.log('DEBUG: useDepositToPool - user NOT opted into LP token, adding opt-in txn...')
          composer.addTransaction(
            algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
              sender: activeAddress,
              receiver: activeAddress,
              assetIndex: Number(lpTokenId),
              amount: 0,
              suggestedParams: sp,
            }),
            transactionSigner
          )
          groupSize++
        }
      }

      // USDC payment transfer to the pool
      const paymentTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: algosdk.getApplicationAddress(deployments.lending_pool_app_id),
        assetIndex: deployments.usdc_asset_id,
        amount: amountMicro,
        suggestedParams: sp,
      })
      console.log('DEBUG: useDepositToPool - payment txn created', {
        sender: activeAddress,
        receiver: algosdk.getApplicationAddress(deployments.lending_pool_app_id),
        assetIndex: deployments.usdc_asset_id,
        amount: amountMicro.toString(),
      })

      // Deposit call with extra fee to cover inner txn (LP token mint)
      // 1 inner txn (itxn.assetTransfer to mint LP tokens) needs 1000 microAlgos
      const extraFee = algokit.microAlgos(2000)
      console.log('DEBUG: useDepositToPool - sending transaction group with', groupSize, 'opt-in txns + 1 payment + 1 app call, extraFee:', extraFee.toString())

      const result = await (await composer.deposit({
        args: [{ txn: paymentTxn, signer: transactionSigner }],
        extraFee: extraFee as any,
      }).composer()).send()

      console.log('DEBUG: useDepositToPool - success! txIds:', result.txIds)
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
        extraFee: (algokit.microAlgos(5000) as any),
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