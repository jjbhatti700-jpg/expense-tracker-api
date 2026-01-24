import { Request, Response } from 'express'
import Category from '../models/Category'

// ====================================
// DEFAULT CATEGORIES (seed data)
// ====================================

const DEFAULT_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: 'Utensils', color: '#f97316', isDefault: true },
  { id: 'transport', label: 'Transport', icon: 'Car', color: '#3b82f6', isDefault: true },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', isDefault: true },
  { id: 'entertainment', label: 'Entertainment', icon: 'Clapperboard', color: '#8b5cf6', isDefault: true },
  { id: 'bills', label: 'Bills & Utilities', icon: 'Receipt', color: '#ef4444', isDefault: true },
  { id: 'health', label: 'Health', icon: 'Heart', color: '#22c55e', isDefault: true },
  { id: 'income', label: 'Income', icon: 'Wallet', color: '#22c55e', isDefault: true },
  { id: 'other', label: 'Other', icon: 'Package', color: '#64748b', isDefault: true },
]

// ====================================
// SEED DEFAULT CATEGORIES
// ====================================

export const seedCategories = async (): Promise<void> => {
  try {
    const count = await Category.countDocuments()
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES)
      console.log('✅ Default categories seeded')
    }
  } catch (error) {
    console.error('Error seeding categories:', error)
  }
}

// ====================================
// GET ALL CATEGORIES
// ====================================

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ isDefault: -1, label: 1 })

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
    })
  }
}

// ====================================
// GET SINGLE CATEGORY
// ====================================

export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findOne({ id: req.params.id })

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category',
    })
  }
}

// ====================================
// CREATE CATEGORY
// ====================================

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, label, icon, color } = req.body

    // Validate required fields
    if (!id || !label) {
      res.status(400).json({
        success: false,
        message: 'Please provide category ID and label',
      })
      return
    }

    // Check if ID already exists
    const existing = await Category.findOne({ id: id.toLowerCase() })
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Category with this ID already exists',
      })
      return
    }

    // Create category
    const category = await Category.create({
      id: id.toLowerCase().replace(/\s+/g, '-'),
      label,
      icon: icon || 'Tag',
      color: color || '#6366f1',
      isDefault: false,
    })

    res.status(201).json({
      success: true,
      data: category,
    })
  } catch (error: any) {
    console.error('Error creating category:', error)

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Category with this ID already exists',
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating category',
    })
  }
}

// ====================================
// UPDATE CATEGORY
// ====================================

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, icon, color, budget } = req.body

    const category = await Category.findOne({ id: req.params.id })

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      })
      return
    }

    // Update fields
    if (label) category.label = label
    if (icon) category.icon = icon
    if (color) category.color = color
    if (budget !== undefined) category.budget = budget

    await category.save()

    res.status(200).json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while updating category',
    })
  }
}

// ====================================
// DELETE CATEGORY
// ====================================

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findOne({ id: req.params.id })

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      })
      return
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete default categories',
      })
      return
    }

    await Category.deleteOne({ id: req.params.id })

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category',
    })
  }
}