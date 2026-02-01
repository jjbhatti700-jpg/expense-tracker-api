import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

// Import routes
import transactionRoutes from '../src/routes/transactionRoutes'
import categoryRoutes from '../src/routes/categoryRoutes'
import authRoutes from '../src/routes/authRoutes'
import emailRoutes from '../src/routes/emailRoutes'
import { seedCategories } from '../src/controllers/categoryController'

// ====================================
// CREATE EXPRESS APP
// ====================================

const app: Express = express()

// ====================================
// MIDDLEWARE
// ====================================

app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ====================================
// MONGODB CONNECTION (cached for serverless)
// ====================================

let isConnected = false

const connectDB = async (): Promise<void> => {
  if (isConnected) return

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker'
    
    await mongoose.connect(mongoURI, {
      bufferCommands: false,
    })

    isConnected = true
    console.log('✅ MongoDB Connected Successfully')

    // Seed categories on first connection
    await seedCategories()
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error)
    throw error
  }
}

// ====================================
// ROUTES
// ====================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ExpenseFlow API is running',
    timestamp: new Date().toISOString(),
  })
})

// Auth routes (public)
app.use('/api/auth', authRoutes)

// Transaction routes (protected)
app.use('/api/transactions', transactionRoutes)

// Category routes
app.use('/api/categories', categoryRoutes)

// Email routes (protected)
app.use('/api/email', emailRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// ====================================
// EXPORT HANDLER FOR VERCEL
// ====================================

export default async function handler(req: any, res: any) {
  // Connect to MongoDB before handling request
  await connectDB()
  // Pass request to Express app
  app(req, res)
}