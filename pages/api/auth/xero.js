export default function handler(req, res) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.XERO_CLIENT_ID,
    redirect_uri: process.env.XERO_REDIRECT_URI,
    scope: 'accounting.transactions accounting.reports.read accounting.contacts offline_access',
    state: 'xero_oauth_state'
  })

  res.redirect(
    `https://login.xero.com/identity/connect/authorize?${params}`
  )
}