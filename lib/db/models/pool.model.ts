import mongoose, { Schema, Document } from 'mongoose'

export interface IPool extends Document {
  snapshot_round: number
  total_deposits_usdc: number
  total_borrowed_usdc: number
  utilization_rate: number
  apy: number
  timestamp: Date
}

const PoolSchema = new Schema<IPool>({
  snapshot_round: { type: Number, required: true },
  total_deposits_usdc: { type: Number, required: true },
  total_borrowed_usdc: { type: Number, required: true },
  utilization_rate: { type: Number, required: true },
  apy: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
})

export const Pool = mongoose.models.Pool || mongoose.model<IPool>('Pool', PoolSchema)
