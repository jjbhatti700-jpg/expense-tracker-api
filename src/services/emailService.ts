import nodemailer from 'nodemailer'

// ====================================
// CREATE TRANSPORTER
// ====================================

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// ====================================
// SEND EMAIL
// ====================================

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent to ${options.to}`)
    return true
  } catch (error) {
    console.error('❌ Email error:', error)
    return false
  }
}

// ====================================
// EMAIL TEMPLATES
// ====================================

interface ReportData {
  userName: string
  period: string
  totalIncome: number
  totalExpenses: number
  balance: number
  topCategories: Array<{ name: string; amount: number; percentage: number }>
  transactionCount: number
  currency: string
}

export const generateReportEmail = (data: ReportData): string => {
  const balanceColor = data.balance >= 0 ? '#22c55e' : '#ef4444'
  
  const categoryRows = data.topCategories
    .map(cat => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${cat.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.currency}${cat.amount.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${cat.percentage.toFixed(1)}%</td>
      </tr>
    `)
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ExpenseFlow Report</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💰 ExpenseFlow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Financial Report</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Greeting -->
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
            Hi <strong>${data.userName}</strong>,
          </p>
          <p style="font-size: 16px; color: #374151; margin: 0 0 30px 0;">
            Here's your expense report for <strong>${data.period}</strong>:
          </p>

          <!-- Summary Cards -->
          <div style="display: flex; gap: 15px; margin-bottom: 30px;">
            <div style="flex: 1; background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #166534;">Income</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #22c55e;">${data.currency}${data.totalIncome.toFixed(2)}</p>
            </div>
            <div style="flex: 1; background-color: #fef2f2; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">Expenses</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #ef4444;">${data.currency}${data.totalExpenses.toFixed(2)}</p>
            </div>
            <div style="flex: 1; background-color: #f5f3ff; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #5b21b6;">Balance</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: ${balanceColor};">${data.currency}${data.balance.toFixed(2)}</p>
            </div>
          </div>

          <!-- Top Categories -->
          ${data.topCategories.length > 0 ? `
            <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 15px 0;">📊 Top Spending Categories</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Category</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Amount</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">%</th>
                </tr>
              </thead>
              <tbody>
                ${categoryRows}
              </tbody>
            </table>
          ` : ''}

          <!-- Stats -->
          <div style="background-color: #f9fafb; padding: 15px 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              📝 Total Transactions: <strong>${data.transactionCount}</strong>
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" 
               style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Full Dashboard
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">This report was generated automatically by ExpenseFlow.</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ExpenseFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ====================================
// BUDGET ALERT EMAIL
// ====================================

interface BudgetAlertData {
  userName: string
  categoryName: string
  budget: number
  spent: number
  percentage: number
  currency: string
}

export const generateBudgetAlertEmail = (data: BudgetAlertData): string => {
  const isExceeded = data.percentage >= 100
  const statusColor = isExceeded ? '#ef4444' : '#f59e0b'
  const statusText = isExceeded ? 'Budget Exceeded!' : 'Budget Warning'
  const statusEmoji = isExceeded ? '🚨' : '⚠️'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Budget Alert</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background-color: ${statusColor}; padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${statusEmoji} ${statusText}</h1>
        </div>

        <!-- Content -->
        <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
            Hi <strong>${data.userName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0;">
            Your spending in <strong>${data.categoryName}</strong> has reached 
            <strong style="color: ${statusColor};">${data.percentage.toFixed(0)}%</strong> of your budget.
          </p>

          <!-- Progress Bar -->
          <div style="background-color: #e5e7eb; border-radius: 10px; height: 20px; margin-bottom: 20px; overflow: hidden;">
            <div style="background-color: ${statusColor}; height: 100%; width: ${Math.min(data.percentage, 100)}%; border-radius: 10px;"></div>
          </div>

          <!-- Details -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
              💰 Budget: <strong>${data.currency}${data.budget.toFixed(2)}</strong>
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
              💸 Spent: <strong style="color: ${statusColor};">${data.currency}${data.spent.toFixed(2)}</strong>
            </p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              📊 Remaining: <strong>${data.currency}${Math.max(data.budget - data.spent, 0).toFixed(2)}</strong>
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" 
               style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Review Spending
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}