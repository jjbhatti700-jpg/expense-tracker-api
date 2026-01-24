import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

// ====================================
// GENERATE JWT TOKEN
// ====================================

const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ====================================
// SIGNUP - Create new user
// ====================================

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      })
      return
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      })
      return
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    })

    // Generate token
    const token = generateToken(user._id.toString())

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    })
  } catch (error: any) {
    console.error('Signup error:', error)

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message)
      res.status(400).json({
        success: false,
        message: messages.join(', '),
      })
      return
    }

    // Handle duplicate email error
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Server error during signup',
    })
  }
}

// ====================================
// LOGIN - Authenticate user
// ====================================

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      })
      return
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
      return
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
      return
    }

    // Generate token
    const token = generateToken(user._id.toString())

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    })
  }
}

// ====================================
// GET CURRENT USER
// ====================================

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is attached to request by auth middleware
    const user = await User.findById((req as any).user.id)

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}