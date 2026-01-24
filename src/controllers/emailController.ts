import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Transaction from '../models/Transaction'
import Category from '../models/Category'
import User from '../models/User'
import { sendEmail, generateReportEmail, generateBudgetAlertEmail } from '../services/emailService'

// ====================================
// SEND EXPENSE REPORT
// ====================================

export const sendExpenseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const { period = 'month', currency = '$' } = req.body

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date
    let periodLabel: string

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        periodLabel = 'Last 7 Days'
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        periodLabel = `Year ${now.getFullYear()}`
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })
    }

    // Get transactions for period
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: now },
    })

    // Calculate totals
    let totalIncome = 0
    let totalExpenses = 0
    const categoryTotals: Record<string, number> = {}

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount
      } else {
        totalExpenses += t.amount
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
      }
    })

    // Get category labels
    const categories = await Category.find({
      $or: [{ user: userId }, { user: null }],
    })
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.label
      return acc
    }, {} as Record<string, string>)

    // Top categories
    const topCategories = Object.entries(categoryTotals)
      .map(([id, amount]) => ({
        name: categoryMap[id] || id,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Generate email
    const html = generateReportEmail({
      userName: user.name,
      period: periodLabel,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      topCategories,
      transactionCount: transactions.length,
      currency,
    })

    // Send email
    const success = await sendEmail({
      to: user.email,
      subject: `📊 ExpenseFlow Report - ${periodLabel}`,
      html,
    })

    if (success) {
      res.status(200).json({
        success: true,
        message: `Report sent to ${user.email}`,
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email. Check email configuration.',
      })
    }
  } catch (error) {
    console.error('Error sending report:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while sending report',
    })
  }
}

// ====================================
// SEND BUDGET ALERT
// ====================================

export const sendBudgetAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const { categoryId, currency = '$' } = req.body

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Get category
    const category = await Category.findOne({
      id: categoryId,
      $or: [{ user: userId }, { user: null }],
    })

    if (!category || !category.budget) {
      res.status(400).json({ success: false, message: 'Category not found or no budget set' })
      return
    }

    // Calculate current month spending
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const result = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          category: categoryId,
          type: 'expense',
          date: { $gte: monthStart, $lte: now },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    const spent = result[0]?.total || 0
    const percentage = (spent / category.budget) * 100

    // Generate email
    const html = generateBudgetAlertEmail({
      userName: user.name,
      categoryName: category.label,
      budget: category.budget,
      spent,
      percentage,
      currency,
    })

    // Send email
    const success = await sendEmail({
      to: user.email,
      subject: `${percentage >= 100 ? '🚨' : '⚠️'} Budget Alert: ${category.label}`,
      html,
    })

    if (success) {
      res.status(200).json({
        success: true,
        message: `Budget alert sent to ${user.email}`,
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
      })
    }
  } catch (error) {
    console.error('Error sending budget alert:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while sending alert',
    })
  }
}

// ====================================
// TEST EMAIL CONFIGURATION
// ====================================

export const testEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    const success = await sendEmail({
      to: user.email,
      subject: '✅ ExpenseFlow - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1 style="color: #6366f1;">🎉 Email Works!</h1>
          <p>Your email configuration is set up correctly.</p>
          <p style="color: #6b7280;">You can now receive expense reports and budget alerts.</p>
        </div>
      `,
    })

    if (success) {
      res.status(200).json({
        success: true,
        message: `Test email sent to ${user.email}`,
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email. Check your email configuration in .env',
      })
    }
  } catch (error) {
    console.error('Error testing email:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while testing email',
    })
  }
}