import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

// ====================================
// EXTEND REQUEST TYPE
// ====================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
      }
    }
  }
}

// ====================================
// PROTECT MIDDLEWARE
// ====================================

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Check if token exists
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      })
      return
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as { id: string }

      // Check if user still exists
      const user = await User.findById(decoded.id)

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User no longer exists',
        })
        return
      }

      // Attach user to request
      req.user = { id: decoded.id }

      next()
    } catch (err) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token',
      })
      return
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    })
  }
}