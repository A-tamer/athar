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
  Legend,
} from 'recharts'

const OLIVE_LIGHT = '#7d9048'
const GOLD = '#d4a64a'
const SAND = '#e5d8bd'
const SAND_DARK = '#c7ab7f'

const pieColors = [OLIVE_LIGHT, SAND]

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-xl border border-beige-300 bg-white px-3 py-2 text-sm shadow-lg text-right" dir="rtl">
      <p className="font-bold text-olive-800">{p.name}</p>
      <p className="tabular-nums text-olive-700">{Number(p.value).toLocaleString()} شنطة</p>
    </div>
  )
}

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-beige-300 bg-white px-3 py-2 text-sm shadow-lg text-right" dir="rtl">
      <p className="font-bold text-olive-800">{row.fullLabel}</p>
      <p className="tabular-nums text-olive-700">{row.display}</p>
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
    { name: 'شنط مُحقَّقة', value: boxCount },
    { name: 'متبقي للهدف', value: remaining },
  ]

  const totalGoalMoney = boxGoal * effectiveCostPerBox
  const moneyProgressPct =
    totalGoalMoney > 0 ? Math.min(100, Math.round((totalDonations / totalGoalMoney) * 100)) : 0

  const avgPerBox = boxCount > 0 ? totalDonations / boxCount : 0
  const avgVsCostPct =
    effectiveCostPerBox > 0 && boxCount > 0
      ? Math.min(100, Math.round((avgPerBox / effectiveCostPerBox) * 100))
      : 0

  const histogramData = [
    {
      name: 'هدف الشنط',
      pct: percentToGoal,
      fullLabel: 'التقدم نحو هدف الشنط',
      display: `${percentToGoal}% (${boxCount.toLocaleString()} / ${boxGoal.toLocaleString()} شنطة)`,
    },
    {
      name: 'التغطية المالية',
      pct: moneyProgressPct,
      fullLabel: 'التبرعات مقابل تكلفة الهدف كاملاً',
      display: `${moneyProgressPct}% (${totalDonations.toLocaleString()} ج.م / ${Math.round(totalGoalMoney).toLocaleString()} ج.م تقديراً)`,
    },
    {
      name: 'متوسط التبرع / شنطة',
      pct: avgVsCostPct,
      fullLabel: 'متوسط التبرع لكل شنطة مقابل التكلفة التقديرية',
      display:
        boxCount > 0
          ? `${avgVsCostPct}% (متوسط ${Math.round(avgPerBox).toLocaleString()} ج.م لكل شنطة)`
          : 'لا توجد شنط محسوبة بعد',
    },
  ]

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-8 max-w-5xl mx-auto" dir="rtl">
      <div className="rounded-2xl border border-beige-200 bg-beige-50/80 p-4 sm:p-6 shadow-sm">
        <h3 className="text-center font-bold text-olive-800 mb-1">توزيع هدف الشنط</h3>
        <p className="text-center text-xs text-olive-600 mb-4">دائرة: المُنجز مقابل المتبقي</p>
        <div className="h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                verticalAlign="bottom"
                formatter={(value) => <span className="text-olive-800 text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-sm font-bold text-olive-700 mt-2">{percentToGoal}% من الهدف</p>
      </div>

      <div className="rounded-2xl border border-beige-200 bg-beige-50/80 p-4 sm:p-6 shadow-sm">
        <h3 className="text-center font-bold text-olive-800 mb-1">مؤشرات التقدم</h3>
        <p className="text-center text-xs text-olive-600 mb-4">أعمدة: نِسَب ومؤشرات (مرر للتفاصيل)</p>
        <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5d8bd" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#4c582e', fontSize: 11 }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={56}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#4c582e', fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                width={36}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(125, 144, 72, 0.08)' }} />
              <Bar dataKey="pct" name="النسبة" radius={[8, 8, 0, 0]}>
                {histogramData.map((_, i) => (
                  <Cell key={i} fill={i === 1 ? GOLD : i === 2 ? SAND_DARK : OLIVE_LIGHT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
