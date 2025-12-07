'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  completed: number
  pending: number
  inTransit: number
}

interface OrdersBarChartProps {
  data: DataPoint[]
  loading?: boolean
}

export function OrdersBarChart({ data, loading = false }: OrdersBarChartProps) {
  if (loading) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg animate-pulse" />
    )
  }

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg border border-gray-200">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
          <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
          <Bar dataKey="inTransit" stackId="a" fill="#3b82f6" name="In Transit" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
