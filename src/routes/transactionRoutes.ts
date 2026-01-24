import { Router } from 'express'
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getStatistics,
} from '../controllers/transactionController'
import { protect } from '../middleware/auth'

const router = Router()

// All transaction routes are protected
router.use(protect)

// ====================================
// TRANSACTION ROUTES
// ====================================

// GET /api/transactions - Get all transactions
router.get('/', getTransactions)

// GET /api/transactions/stats - Get statistics
router.get('/stats', getStatistics)

// GET /api/transactions/:id - Get single transaction
router.get('/:id', getTransaction)

// POST /api/transactions - Create transaction
router.post('/', createTransaction)

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction)

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction)

export default router