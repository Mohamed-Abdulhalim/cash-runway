export async function getXeroClient(storedTokens) {
  const now = Date.now()
  let tokens = storedTokens

  if (now > tokens.expires_at - 60000) {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: process.env.XERO_CLIENT_ID,
        client_secret: process.env.XERO_CLIENT_SECRET,
      })
    })
    tokens = await response.json()
  }

  return {
    get: (url) => fetch(url, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': tokens.tenant_id,
        Accept: 'application/json'
      }
    }).then(r => r.json())
  }
}