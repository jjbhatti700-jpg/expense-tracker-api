import { Router } from 'express'
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController'

const router = Router()

// ====================================
// CATEGORY ROUTES
// ====================================

// GET /api/categories - Get all categories
router.get('/', getCategories)

// GET /api/categories/:id - Get single category
router.get('/:id', getCategory)

// POST /api/categories - Create category
router.post('/', createCategory)

// PUT /api/categories/:id - Update category
router.put('/:id', updateCategory)

// DELETE /api/categories/:id - Delete category
router.delete('/:id', deleteCategory)

export default router