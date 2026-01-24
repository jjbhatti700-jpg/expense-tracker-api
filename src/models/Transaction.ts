import mongoose, { Document, Schema } from 'mongoose'

// ====================================
// TYPES
// ====================================

export type TransactionType = 'income' | 'expense'

// Category is now a string to support custom categories
export type Category = string

// Interface for TypeScript
export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId
  type: TransactionType
  amount: number
  category: Category
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

// ====================================
// SCHEMA
// ====================================

const transactionSchema = new Schema<ITransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
)

// ====================================
// INDEXES (for better query performance)
// ====================================

transactionSchema.index({ user: 1, date: -1 })
transactionSchema.index({ user: 1, type: 1 })
transactionSchema.index({ user: 1, category: 1 })

// ====================================
// EXPORT MODEL
// ====================================

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema)

export default Transaction