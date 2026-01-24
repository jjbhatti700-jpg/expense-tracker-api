import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' } as jwt.SignOptions)
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email and password' })
      return
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists' })
      return
    }

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id.toString())

    res.status(201).json({
      success: true,
      data: { user: { id: user._id, name: user.name, email: user.email }, token },
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    res.status(500).json({ success: false, message: 'Server error during signup' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' })
      return
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' })
      return
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' })
      return
    }

    const token = generateToken(user._id.toString())

    res.status(200).json({
      success: true,
      data: { user: { id: user._id, name: user.name, email: user.email }, token },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Server error during login' })
  }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id)

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    res.status(200).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}