import { Router } from 'express'
import { signup, login, getMe } from '../controllers/authController'
import { protect } from '../middleware/auth'

const router = Router()

// ====================================
// AUTH ROUTES
// ====================================

// POST /api/auth/signup - Create new user
router.post('/signup', signup)

// POST /api/auth/login - Login user
router.post('/login', login)

// GET /api/auth/me - Get current user (protected)
router.get('/me', protect, getMe)

export default router