'use client'

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  name: string
  value: number
}

interface OrdersStatusPieChartProps {
  data: DataPoint[]
  loading?: boolean
}

const COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  'in-transit': '#8b5cf6',
  delivered: '#22c55e',
  rejected: '#ef4444',
}

export function OrdersStatusPieChart({
  data,
  loading = false,
}: OrdersStatusPieChartProps) {
  if (loading) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg animate-pulse" />
    )
  }

  const dataWithColors = data.map((item) => ({
    ...item,
    color: COLORS[item.name as keyof typeof COLORS] || '#6b7280',
  }))

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg border border-gray-200">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} orders`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
