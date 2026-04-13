import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  wallet_address: string
  credit_score: number
  borrow_limit: number
  total_borrowed: number
  total_repaid: number
  active_loans: number
  on_time_repayments: number
  late_repayments: number
  last_synced_round: number
  created_at: Date
  updated_at: Date
}

const UserSchema = new Schema<IUser>({
  wallet_address: { type: String, required: true, unique: true, index: true },
  credit_score: { type: Number, default: 300 },
  borrow_limit: { type: Number, default: 0 },
  total_borrowed: { type: Number, default: 0 },
  total_repaid: { type: Number, default: 0 },
  active_loans: { type: Number, default: 0 },
  on_time_repayments: { type: Number, default: 0 },
  late_repayments: { type: Number, default: 0 },
  last_synced_round: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
