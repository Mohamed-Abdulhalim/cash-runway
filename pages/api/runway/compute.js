import { getSnapshot } from '../../../lib/db'
import { computeRunway } from '../../../lib/compute'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const snapshot = await getSnapshot(req, res)
    const result = computeRunway(snapshot)
    res.json({
      ...result,
      last_synced_at: snapshot.last_synced_at
    })
  } catch (err) {
    console.error('Runway compute error:', err.message)
    res.status(500).json({ error: err.message })
  }
}