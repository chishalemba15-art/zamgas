'use client'

import { TrendingDown, TreePine, Heart, Clock, Coins } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { Order } from '@/lib/api'
import { formatImpactStats } from '@/lib/environmentalImpact'

interface CarbonSavingsCardProps {
  orders?: Order[]
}

export function CarbonSavingsCard({ orders = [] }: CarbonSavingsCardProps) {
  const stats = formatImpactStats(orders)
  const isNewUser = orders.length === 0

  return (
    <div
      className="p-5 rounded-2xl relative overflow-hidden"
      style={{
        background: zamgasTheme.gradients.primary,
        boxShadow: zamgasTheme.shadows.medium,
      }}
    >
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-5 w-5" />
              <h3
                className="font-bold text-lg"
                style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
              >
                Your Impact
              </h3>
            </div>
            <p className="text-sm opacity-90">
              {isNewUser ? 'Start your clean energy journey' : `Making a difference with ${stats.totalOrders} order${stats.totalOrders !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {isNewUser ? '🌱 Start' : stats.totalOrders >= 10 ? '⭐ Hero' : '💚 Active'}
          </div>
        </div>

        {isNewUser ? (
          // New user state - encouraging message
          <div
            className="p-6 rounded-xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <TreePine className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <p className="text-base font-semibold mb-2">
              Place your first order to start tracking your environmental impact!
            </p>
            <p className="text-sm opacity-90">
              Every LPG order saves CO₂, protects forests, and keeps your family healthy
            </p>
          </div>
        ) : (
          <>
            {/* Impact metrics grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs opacity-80">CO₂ Saved</span>
                </div>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
                >
                  {stats.co2Saved}
                </p>
                <p className="text-xs opacity-80">kilograms</p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TreePine className="h-4 w-4" />
                  <span className="text-xs opacity-80">Trees Saved</span>
                </div>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
                >
                  {stats.treesEquivalent}
                </p>
                <p className="text-xs opacity-80">equivalent</p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs opacity-80">Time Saved</span>
                </div>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
                >
                  {stats.timeSaved}
                </p>
                <p className="text-xs opacity-80">hours</p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4" />
                  <span className="text-xs opacity-80">Saved</span>
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
                >
                  {stats.costSavings}
                </p>
                <p className="text-xs opacity-80">efficiency</p>
              </div>
            </div>

            {/* Educational message */}
            <div
              className="p-3 rounded-xl text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                <Heart className="h-4 w-4 fill-current" />
                <span>
                  {stats.totalOrders >= 10 
                    ? 'Amazing! You\'re a clean energy champion!' 
                    : 'Keep ordering - every choice helps protect our planet'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
