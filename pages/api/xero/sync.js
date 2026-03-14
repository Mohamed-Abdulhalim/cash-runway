import { getTokens, saveSnapshot } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
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
    console.log('Invoices status:', invoicesRes.status)
    console.log('Invoices body:', invoicesText.substring(0, 300))
    const invoices = invoicesRes.status === 200 ? JSON.parse(invoicesText) : { Invoices: [] }

    const billsRes = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%3D%22AUTHORISED%22%26%26Type%3D%3D%22ACCPAY%22', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': tenantId,
        Accept: 'application/json'
      }
    })
    const billsText = await billsRes.text()
    console.log('Bills status:', billsRes.status)
    console.log('Bills body:', billsText.substring(0, 300))
    const bills = billsRes.status === 200 ? JSON.parse(billsText) : { Invoices: [] }

    const today = new Date()

    const snapshot = {
      starting_cash: 0,

      inflows: (invoices.Invoices || []).map(inv => ({
        id: inv.InvoiceID,
        amount: inv.AmountDue,
        due_date: inv.DueDate,
        is_overdue: new Date(inv.DueDate) < today
      })),

      outflows: (bills.Invoices || []).map(bill => ({
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