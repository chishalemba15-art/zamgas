'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  revenue: number
}

interface RevenueLineChartProps {
  data: DataPoint[]
  loading?: boolean
}

export function RevenueLineChart({ data, loading = false }: RevenueLineChartProps) {
  if (loading) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg animate-pulse" />
    )
  }

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg border border-gray-200">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value) => `ZK ${value.toLocaleString()}`}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#0284c7"
            dot={{ fill: '#0284c7', r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue (ZMW)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
