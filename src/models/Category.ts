import mongoose, { Document, Schema } from 'mongoose'

// ====================================
// TYPES
// ====================================

export interface ICategory extends Document {
  user: mongoose.Types.ObjectId | null  // null for default categories
  id: string
  label: string
  icon: string
  color: string
  isDefault: boolean
  budget: number | null  // Monthly budget limit (null = no limit)
  createdAt: Date
  updatedAt: Date
}

// ====================================
// SCHEMA
// ====================================

const categorySchema = new Schema<ICategory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,  // null for default categories (available to all)
    },
    id: {
      type: String,
      required: [true, 'Category ID is required'],
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: [true, 'Category label is required'],
      trim: true,
      maxlength: [50, 'Label cannot exceed 50 characters'],
    },
    icon: {
      type: String,
      required: [true, 'Icon is required'],
      default: 'Tag',
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      default: '#6366f1',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    budget: {
      type: Number,
      default: null,
      min: [0, 'Budget cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
)

// Create compound unique index (user + id combination must be unique)
categorySchema.index({ user: 1, id: 1 }, { unique: true })

// ====================================
// EXPORT MODEL
// ====================================

const Category = mongoose.model<ICategory>('Category', categorySchema)

export default Category