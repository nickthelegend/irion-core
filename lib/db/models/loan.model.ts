import mongoose, { Schema, Document } from 'mongoose'

export interface ILoan extends Document {
  loan_id: number
  borrower_address: string
  merchant_address: string
  principal_usdc: number
  total_repaid_usdc: number
  installment_amount_usdc: number
  num_installments: number
  installments_paid: number
  start_round: number
  next_due_round: number
  status: 'active' | 'completed' | 'defaulted' | 'disputed'
  created_at: Date
  updated_at: Date
}

const LoanSchema = new Schema<ILoan>({
  loan_id: { type: Number, required: true, unique: true, index: true },
  borrower_address: { type: String, required: true, index: true },
  merchant_address: { type: String, required: true },
  principal_usdc: { type: Number, required: true },
  total_repaid_usdc: { type: Number, default: 0 },
  installment_amount_usdc: { type: Number, required: true },
  num_installments: { type: Number, required: true },
  installments_paid: { type: Number, default: 0 },
  start_round: { type: Number, required: true },
  next_due_round: { type: Number, required: true },
  status: { type: String, enum: ['active', 'completed', 'defaulted', 'disputed'], default: 'active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export const Loan = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema)
