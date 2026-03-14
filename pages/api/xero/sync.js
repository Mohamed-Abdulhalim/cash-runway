import { getXeroClient } from '../../../lib/xero'
import { getTokens, saveSnapshot } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const tokens = await getTokens(req, res)
    const xero = await getXeroClient(tokens)

    const [bankAccounts, invoices, bills] = await Promise.all([
      xero.get('https://api.xero.com/api.xro/2.0/BankAccounts'),
      xero.get('https://api.xero.com/api.xro/2.0/Invoices?where=Status=="AUTHORISED"'),
      xero.get('https://api.xero.com/api.xro/2.0/Invoices?where=Type=="ACCPAY"ANDStatus=="AUTHORISED"')
    ])

    const today = new Date()

    const snapshot = {
      starting_cash: bankAccounts.BankAccounts
        .filter(a => a.Type === 'BANK' && !a.IsArchived)
        .reduce((sum, a) => sum + a.Balance, 0),

      inflows: invoices.Invoices.map(inv => ({
        id: inv.InvoiceID,
        amount: inv.AmountDue,
        due_date: inv.DueDate,
        is_overdue: new Date(inv.DueDate) < today
      })),

      outflows: bills.Invoices.map(bill => ({
        id: bill.InvoiceID,
        amount: bill.AmountDue,
        due_date: bill.DueDate,
        is_overdue: new Date(bill.DueDate) < today
      }))
    }

    await saveSnapshot(req, res, snapshot)
    res.json({ ok: true })
  } catch (err) {
    console.error('Xero sync error:', err.message)
    res.status(500).json({ error: err.message })
  }
}