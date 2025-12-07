'use client'

import { Leaf, Droplets, Wind, Zap } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface EcoImpactCardProps {
  variant?: 'compact' | 'full'
}

export function EcoImpactCard({ variant = 'compact' }: EcoImpactCardProps) {
  const benefits = [
    {
      icon: Leaf,
      value: '50%',
      label: 'Less CO₂ than charcoal',
      color: zamgasTheme.colors.accent.teal,
    },
    {
      icon: Wind,
      value: '95%',
      label: 'Cleaner air indoors',
      color: zamgasTheme.colors.primary.forestLight,
    },
    {
      icon: Droplets,
      value: '80%',
      label: 'Less deforestation',
      color: zamgasTheme.colors.secondary.amber,
    },
    {
      icon: Zap,
      value: '3x',
      label: 'More efficient energy',
      color: zamgasTheme.colors.accent.tealLight,
    },
  ]

  if (variant === 'compact') {
    return (
      <div
        className="p-4 rounded-xl border-2"
        style={{
          background: zamgasTheme.gradients.primarySubtle,
          borderColor: zamgasTheme.colors.accent.teal,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: zamgasTheme.colors.accent.teal,
              boxShadow: zamgasTheme.shadows.ecoGlow,
            }}
          >
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3
              className="font-bold text-sm mb-1"
              style={{ color: zamgasTheme.colors.semantic.textPrimary }}
            >
              Clean Cooking Energy
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: zamgasTheme.colors.semantic.textSecondary }}
            >
              LPG produces <strong>50% less CO₂</strong> than charcoal and keeps your home air <strong>95% cleaner</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: '#FFFFFF',
        border: `2px solid ${zamgasTheme.colors.primary.mint}`,
        boxShadow: zamgasTheme.shadows.medium,
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: zamgasTheme.gradients.eco,
            boxShadow: zamgasTheme.shadows.ecoGlow,
          }}
        >
          <Leaf className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3
            className="font-bold text-lg"
            style={{
              color: zamgasTheme.colors.semantic.textPrimary,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Why LPG is Better
          </h3>
          <p
            className="text-sm"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            For you and the planet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="p-4 rounded-xl transition-all hover:scale-105"
            style={{
              background: zamgasTheme.colors.neutral[50],
              border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
            }}
          >
            <benefit.icon
              className="h-5 w-5 mb-2"
              style={{ color: benefit.color }}
            />
            <p
              className="text-2xl font-bold mb-1"
              style={{
                color: zamgasTheme.colors.semantic.textPrimary,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}
            >
              {benefit.value}
            </p>
            <p
              className="text-xs leading-tight"
              style={{ color: zamgasTheme.colors.semantic.textSecondary }}
            >
              {benefit.label}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-5 p-3 rounded-lg text-xs text-center"
        style={{
          background: zamgasTheme.colors.primary.mintLight,
          color: zamgasTheme.colors.primary.forestDark,
        }}
      >
        <strong>Certified Clean Energy</strong> • Approved by Environmental Standards
      </div>
    </div>
  )
}
