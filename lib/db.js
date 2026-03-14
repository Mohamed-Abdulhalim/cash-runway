import { supabase } from './supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'

async function getUserId(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) throw new Error('No authenticated user found')
  return session.user.id
}

async function resolveTenantId(access_token) {
  const res = await fetch('https://api.xero.com/connections', {
    headers: { Authorization: `Bearer ${access_token}` }
  })
  const connections = await res.json()
  if (!connections.length) throw new Error('No Xero tenants connected')
  return connections[0].tenantId
}

export async function saveTokens(req, res, tokens) {
  const user_id = await getUserId(req, res)

  const { error } = await supabase
    .from('user_tokens')
    .upsert({
      user_id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      tenant_id: tokens.tenant_id ?? await resolveTenantId(tokens.access_token),
      expires_at: Date.now() + tokens.expires_in * 1000,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) throw new Error(`saveTokens failed: ${error.message}`)
}

export async function getTokens(req, res) {
  const user_id = await getUserId(req, res)

  const { data, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (error) throw new Error(`getTokens failed: ${error.message}`)
  return data
}

export async function saveSnapshot(req, res, snapshot) {
  const user_id = await getUserId(req, res)

  const { error } = await supabase
    .from('user_snapshots')
    .upsert({
      user_id,
      starting_cash: snapshot.starting_cash,
      inflows: snapshot.inflows,
      outflows: snapshot.outflows,
      last_synced_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) throw new Error(`saveSnapshot failed: ${error.message}`)
}

export async function getSnapshot(req, res) {
  const user_id = await getUserId(req, res)

  const { data, error } = await supabase
    .from('user_snapshots')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (error) throw new Error(`getSnapshot failed: ${error.message}`)
  return data
}