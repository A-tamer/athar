import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts'

const OLIVE_LIGHT = '#7d9048'
const GOLD = '#d4a64a'
const SAND_DARK = '#c7ab7f'

const pieColors = [OLIVE_LIGHT, '#e5d8bd']

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-lg border border-beige-300 bg-white px-2 py-1.5 text-xs shadow text-right tabular-nums" dir="rtl">
      {Number(p.value).toLocaleString()}
    </div>
  )
}

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-beige-300 bg-white px-2 py-1.5 text-xs shadow text-right tabular-nums" dir="rtl">
      {row.display}
    </div>
  )
}

/**
 * @param {object} props
 * @param {number} props.totalDonations
 * @param {number} props.boxCount
 * @param {number} props.percentToGoal
 * @param {number} props.boxGoal
 * @param {number} props.effectiveCostPerBox
 */
export default function RamadanStatsCharts({
  totalDonations,
  boxCount,
  percentToGoal,
  boxGoal,
  effectiveCostPerBox,
}) {
  const remaining = Math.max(0, boxGoal - boxCount)
  const pieData = [
    { name: 'مُنجز', value: boxCount, short: boxCount.toLocaleString() },
    { name: 'متبقي', value: remaining, short: remaining.toLocaleString() },
  ]

  const totalGoalMoney = boxGoal * effectiveCostPerBox
  const moneyProgressPct =
    totalGoalMoney > 0 ? Math.min(100, Math.round((totalDonations / totalGoalMoney) * 100)) : 0

  const avgPerBox = boxCount > 0 ? totalDonations / boxCount : 0
  const avgVsCostPct =
    effectiveCostPerBox > 0 && boxCount > 0
      ? Math.min(100, Math.round((avgPerBox / effectiveCostPerBox) * 100))
      : 0

  const barRows = [
    {
      name: 'شنط / هدف',
      pct: percentToGoal,
      display: `${percentToGoal}%`,
    },
    {
      name: 'ج.م / هدف مالي',
      pct: moneyProgressPct,
      display: `${moneyProgressPct}%`,
    },
    {
      name: 'متوسط / تكلفة',
      pct: avgVsCostPct,
      display: boxCount > 0 ? `${avgVsCostPct}%` : '—',
    },
  ]

  const statTiles = [
    { label: 'ج.م', value: totalDonations.toLocaleString() },
    { label: 'شنط', value: boxCount.toLocaleString() },
    { label: 'هدف شنط', value: boxGoal.toLocaleString() },
    { label: '% هدف', value: `${percentToGoal}%` },
    { label: 'ج.م/شنطة', value: Math.round(effectiveCostPerBox).toLocaleString() },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8" dir="rtl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
        {statTiles.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-beige-200 bg-beige-50/90 px-3 py-4 text-center shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-olive-600 sm:text-xs">{t.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-olive-800 sm:text-2xl">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-2xl border border-beige-200 bg-beige-50/80 p-4 shadow-sm sm:p-5">
          <h3 className="mb-4 text-center text-sm font-bold text-olive-800">شنط: مُنجز / متبقي</h3>
          <div className="h-[240px] w-full min-w-0 sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                  <LabelList dataKey="short" position="outside" fill="#4c582e" style={{ fontSize: 12, fontWeight: 700 }} />
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-beige-200 bg-beige-50/80 p-4 shadow-sm sm:p-5">
          <h3 className="mb-4 text-center text-sm font-bold text-olive-800">نِسَب %</h3>
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barRows} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5d8bd" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#4c582e', fontSize: 10 }} interval={0} height={48} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#4c582e', fontSize: 10 }}
                  tickFormatter={(v) => `${v}`}
                  width={28}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(125, 144, 72, 0.08)' }} />
                <Bar dataKey="pct" radius={[8, 8, 0, 0]}>
                  {barRows.map((_, i) => (
                    <Cell key={i} fill={i === 1 ? GOLD : i === 2 ? SAND_DARK : OLIVE_LIGHT} />
                  ))}
                  <LabelList dataKey="pct" position="top" formatter={(v) => `${v}%`} fill="#4c582e" style={{ fontSize: 11, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
