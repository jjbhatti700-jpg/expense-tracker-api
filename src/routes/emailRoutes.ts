import { Router } from 'express'
import { sendExpenseReport, sendBudgetAlert, testEmail } from '../controllers/emailController'
import { protect } from '../middleware/auth'

const router = Router()

// All email routes are protected
router.use(protect)

// ====================================
// EMAIL ROUTES
// ====================================

// POST /api/email/report - Send expense report
router.post('/report', sendExpenseReport)

// POST /api/email/budget-alert - Send budget alert
router.post('/budget-alert', sendBudgetAlert)

// POST /api/email/test - Test email configuration
router.post('/test', testEmail)

export default router