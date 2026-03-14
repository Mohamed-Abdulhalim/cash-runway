import { AlertCircle, Clock } from 'lucide-react'

export default function RiskItems({ items }) {
  if (!items?.length) return null

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        What's causing the risk
      </h2>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-xl bg-white border border-red-100"
          >
            {item.type === 'overdue_invoice'
              ? <Clock size={20} className="text-orange-400 mt-0.5 shrink-0" />
              : <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            }
            <div>
              <p className="text-sm font-medium text-gray-800">{item.message}</p>
              {item.date && (
                <p className="text-xs text-gray-400 mt-0.5">Due: {item.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}