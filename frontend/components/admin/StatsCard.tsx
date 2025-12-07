'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  change?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
  className?: string
}

export function StatsCard({
  title,
  value,
  icon,
  change,
  loading = false,
  className = '',
}: StatsCardProps) {
  return (
    <div
      className={`
        bg-white p-6 rounded-lg border border-gray-200 shadow-soft
        transition-shadow hover:shadow-medium
        ${className}
      `}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>

      {/* Value and change */}
      <div className="space-y-2">
        {loading ? (
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
        ) : (
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        )}

        {change && !loading && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              change.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change.isPositive ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span>
              {change.isPositive ? '+' : '-'}
              {Math.abs(change.value)}%
            </span>
            <span className="text-gray-600 font-normal">from last month</span>
          </div>
        )}
      </div>
    </div>
  )
}
