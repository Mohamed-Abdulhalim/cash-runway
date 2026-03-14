import { getTokens, saveSnapshot } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const manualBalance = body?.manual_balance ?? null

    const tokens = await getTokens(req, res)

    const connections = await fetch('https://api.xero.com/connections', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json'
      }
    }).then(r => r.json())

    if (!connections.length) {
      return res.status(400).json({ error: 'No Xero organisation connected' })
    }

    const tenantId = connections[0].tenantId

    const invoicesRes = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%3D%22AUTHORISED%22%26%26Type%3D%3D%22ACCREC%22', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': tenantId,
        Accept: 'application/json'
      }
    })
    const invoicesText = await invoicesRes.text()
    const invoices = invoicesRes.status === 200 ? JSON.parse(invoicesText) : { Invoices: [] }

    const billsRes = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%3D%22AUTHORISED%22%26%26Type%3D%3D%22ACCPAY%22', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': tenantId,
        Accept: 'application/json'
      }
    })
    const billsText = await billsRes.text()
    const bills = billsRes.status === 200 ? JSON.parse(billsText) : { Invoices: [] }

    function parseXeroDate(dateStr) {
      if (!dateStr) return null
      const match = dateStr.match(/\/Date\((\d+)/)
      if (match) return new Date(parseInt(match[1])).toISOString().split('T')[0]
      return dateStr
    }

    const today = new Date()

    // if manual balance provided use it, otherwise keep existing or default to 0
    let startingCash = 0
    if (manualBalance !== null) {
      startingCash = manualBalance
    }

    const snapshot = {
      starting_cash: startingCash,

      inflows: (invoices.Invoices || []).map(inv => {
        const dueDate = parseXeroDate(inv.DueDate)
        return {
          id: inv.InvoiceID,
          amount: inv.AmountDue,
          due_date: dueDate,
          is_overdue: dueDate ? new Date(dueDate) < today : false
        }
      }),

      outflows: (bills.Invoices || []).map(bill => {
        const dueDate = parseXeroDate(bill.DueDate)
        return {
          id: bill.InvoiceID,
          amount: bill.AmountDue,
          due_date: dueDate,
          is_overdue: dueDate ? new Date(dueDate) < today : false
        }
      })
    }

    await saveSnapshot(req, res, snapshot)
    res.json({ ok: true })
  } catch (err) {
    console.error('Xero sync error:', err.message)
    res.status(500).json({ error: err.message })
  }
}