import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Transaction from '../models/Transaction'

// ====================================
// GET ALL TRANSACTIONS (for logged-in user)
// ====================================

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id

    // Get query parameters for filtering
    const { type, category, startDate, endDate, search } = req.query

    // Build query object - always filter by user
    const query: any = { user: userId }

    if (type && type !== 'all') {
      query.type = type
    }

    if (category && category !== 'all') {
      query.category = category
    }

    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate as string) }
    }

    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate as string) }
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' }
    }

    // Fetch transactions, sorted by date (newest first)
    const transactions = await Transaction.find(query).sort({ date: -1 })

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions',
    })
  }
}

// ====================================
// GET SINGLE TRANSACTION
// ====================================

export const getTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const transaction = await Transaction.findOne({ 
      _id: req.params.id, 
      user: userId 
    })

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: transaction,
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction',
    })
  }
}

// ====================================
// CREATE TRANSACTION
// ====================================

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const { type, amount, category, description, date } = req.body

    // Validate required fields
    if (!type || !amount || !category || !description) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      })
      return
    }

    // Create transaction with user ID
    const transaction = await Transaction.create({
      user: userId,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
    })

    res.status(201).json({
      success: true,
      data: transaction,
    })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message)
      res.status(400).json({
        success: false,
        message: messages.join(', '),
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction',
    })
  }
}

// ====================================
// UPDATE TRANSACTION
// ====================================

export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const { type, amount, category, description, date } = req.body

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { type, amount, category, description, date },
      { new: true, runValidators: true }
    )

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: transaction,
    })
  } catch (error: any) {
    console.error('Error updating transaction:', error)

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message)
      res.status(400).json({
        success: false,
        message: messages.join(', '),
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction',
    })
  }
}

// ====================================
// DELETE TRANSACTION
// ====================================

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const transaction = await Transaction.findOneAndDelete({ 
      _id: req.params.id, 
      user: userId 
    })

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction',
    })
  }
}

// ====================================
// GET STATISTICS (for logged-in user)
// ====================================

export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.id)

    // Total income
    const incomeResult = await Transaction.aggregate([
      { $match: { user: userId, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    // Total expenses
    const expenseResult = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    // Expenses by category
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ])

    // Monthly data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyData = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    const totalIncome = incomeResult[0]?.total || 0
    const totalExpenses = expenseResult[0]?.total || 0

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        categoryBreakdown,
        monthlyData,
      },
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
    })
  }
}