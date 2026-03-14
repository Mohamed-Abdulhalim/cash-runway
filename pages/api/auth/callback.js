import { saveTokens } from '../../../lib/db'

export default async function handler(req, res) {
  const { code } = req.query

  try {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI,
        client_id: process.env.XERO_CLIENT_ID,
        client_secret: process.env.XERO_CLIENT_SECRET,
      })
    })

    const tokens = await response.json()
    await saveTokens(req, res, tokens)
    res.redirect('/')
  } catch (err) {
    console.error('Xero callback error:', err.message)
    res.status(500).json({ error: 'Xero authentication failed' })
  }
}