import mongoose, { Schema, Document } from 'mongoose'

export interface IMerchant extends Document {
  wallet_address: string
  business_name: string
  total_received_usdc: number
  pending_escrow_usdc: number
  completed_orders: number
  disputed_orders: number
  created_at: Date
  updated_at: Date
}

const MerchantSchema = new Schema<IMerchant>({
  wallet_address: { type: String, required: true, unique: true, index: true },
  business_name: { type: String, default: 'Unnamed Business' },
  total_received_usdc: { type: Number, default: 0 },
  pending_escrow_usdc: { type: Number, default: 0 },
  completed_orders: { type: Number, default: 0 },
  disputed_orders: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export const Merchant = mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', MerchantSchema)
