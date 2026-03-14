const CONSERVATIVE_WEIGHT = 0.8
const PROJECTION_DAYS = 60

export function computeRunway(snapshot) {
  const { starting_cash, inflows, outflows } = snapshot
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let cash = starting_cash
  const riskItems = []
  let verdict = 'fine'

  // flag overdue invoices immediately
  inflows
    .filter(i => i.is_overdue)
    .forEach(i => riskItems.push({
      type: 'overdue_invoice',
      amount: i.amount,
      due_date: i.due_date,
      message: `Invoice of $${i.amount} is overdue`
    }))

  // day by day projection
  for (let day = 0; day < PROJECTION_DAYS; day++) {
    const date = new Date(today)
    date.setDate(today.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]

    // add weighted inflows due this day (skip overdue)
    inflows
      .filter(i => !i.is_overdue && i.due_date?.startsWith(dateStr))
      .forEach(i => { cash += i.amount * CONSERVATIVE_WEIGHT })

    // subtract outflows due this day
    outflows
      .filter(o => o.due_date?.startsWith(dateStr))
      .forEach(o => {
        cash -= o.amount
        if (cash < 0) {
          verdict = 'at_risk'
          riskItems.push({
            type: 'shortfall',
            date: dateStr,
            amount: o.amount,
            message: `Bill of $${o.amount} due on ${dateStr} may not be covered`
          })
        }
      })
  }

  return { verdict, cash_at_end: cash, risk_items: riskItems }
}