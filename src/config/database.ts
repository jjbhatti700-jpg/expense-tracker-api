import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker'
    
    await mongoose.connect(mongoURI)
    
    console.log('✅ MongoDB Connected Successfully')
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error)
    process.exit(1)
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Error:', err)
})

export default connectDB