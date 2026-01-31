import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

import connectDB from './config/database'
import transactionRoutes from './routes/transactionRoutes'
import categoryRoutes from './routes/categoryRoutes'
import authRoutes from './routes/authRoutes'
import emailRoutes from './routes/emailRoutes'
import { seedCategories } from './controllers/categoryController'

// ====================================
// CREATE EXPRESS APP
// ====================================

const app: Express = express()
const PORT = Number(process.env.PORT) || 5000

// ====================================
// MIDDLEWARE
// ====================================

// Security headers
app.use(helmet())
// CORS - Allow frontend to access API
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Parse JSON bodies
app.use(express.json())

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }))

// ====================================
// ROUTES
// ====================================

// Health check route
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
// START SERVER
// ====================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Seed default categories
    await seedCategories()

    // Start listening
    // Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║   🚀 ExpenseFlow API Server                ║
║                                            ║
║   Server:  http://0.0.0.0:${PORT}            ║
║   Status:  Running                         ║
║   Mode:    ${process.env.NODE_ENV || 'development'}                    ║
║                                            ║
╚════════════════════════════════════════════╝
      `)
})
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()// Railway deployment fix 
