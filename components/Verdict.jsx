import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function Verdict({ verdict, cash_at_end }) {
  const isFine = verdict === 'fine'

  return (
    <div className={`
      rounded-2xl p-8 text-center transition-all
      ${isFine ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
    `}>
      <div className="flex justify-center mb-4">
        {isFine
          ? <CheckCircle size={64} className="text-green-500" />
          : <AlertTriangle size={64} className="text-red-500" />
        }
      </div>

      <h1 className={`text-4xl font-bold mb-2 ${isFine ? 'text-green-700' : 'text-red-700'}`}>
        {isFine ? "You're Fine" : "You're At Risk"}
      </h1>

      <p className={`text-lg ${isFine ? 'text-green-600' : 'text-red-600'}`}>
        {isFine
          ? `Projected cash in 60 days: $${cash_at_end.toFixed(2)}`
          : `Projected shortfall in 60 days: $${Math.abs(cash_at_end).toFixed(2)}`
        }
      </p>
    </div>
  )
}