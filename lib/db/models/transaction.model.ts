import mongoose, { Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
  tx_id: string
  wallet_address: string
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'payment'
  amount_usdc: number
  loan_id: number | null
  round: number
  timestamp: Date
  status: 'confirmed' | 'pending' | 'failed'
}

const TransactionSchema = new Schema<ITransaction>({
  tx_id: { type: String, required: true, unique: true },
  wallet_address: { type: String, required: true, index: true },
  type: { type: String, enum: ['deposit', 'withdraw', 'borrow', 'repay', 'payment'], required: true },
  amount_usdc: { type: Number, required: true },
  loan_id: { type: Number, default: null },
  round: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  status: { type: String, enum: ['confirmed', 'pending', 'failed'], default: 'confirmed' },
})

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema)
