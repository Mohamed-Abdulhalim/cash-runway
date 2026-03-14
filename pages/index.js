import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Verdict from '../components/Verdict'
import RiskItems from '../components/RiskItems'
import { RefreshCw, LogOut } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (session) fetchRunway()
  }, [session])

  async function fetchRunway() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/runway/compute')
      if (res.status === 404) {
        setData(null) // no snapshot yet, show connect Xero prompt
        return
      }
      if (!res.ok) throw new Error('Failed to fetch runway')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function syncXero() {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/xero/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      await fetchRunway()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  if (status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cash Runway
          </h1>
          <p className="text-gray-500 mb-8">
            Know if you can pay next month's bills. No spreadsheets.
          </p>
          <button
            onClick={() => signIn('google')}
            className="w-full py-3 px-6 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition"
          >
            Sign in with Google
          </button>
        </div>
      </main>
    )
  }

  if (status === 'loading') {
    return <LoadingScreen message="Loading..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-gray-900">Cash Runway</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={syncXero}
              disabled={syncing}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Xero'}
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>

        {!data && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-500 mb-4">Connect your Xero account to get started</p>
            
              <a href="/api/auth/xero"
              className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition"
            >
              Connect Xero
            </a>
          </div>
        )}

        {loading && <LoadingScreen message="Calculating your runway..." />}

        {error && (
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-6 text-center">
            <p className="text-orange-700 text-sm">{error}</p>
            <button
              onClick={fetchRunway}
              className="mt-3 text-sm text-orange-600 underline"
            >
              Try again
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            <Verdict verdict={data.verdict} cash_at_end={data.cash_at_end} />
            <RiskItems items={data.risk_items} />
            <p className="text-xs text-gray-400 text-center mt-6">
              Last synced: {data.last_synced_at
                ? new Date(data.last_synced_at).toLocaleString()
                : 'just now'}
            </p>
          </>
        )}

      </div>
    </main>
  )
}

function LoadingScreen({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <RefreshCw size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  )
}