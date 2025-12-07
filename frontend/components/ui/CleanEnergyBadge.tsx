'use client'

import { Shield, Award, CheckCircle2 } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface CleanEnergyBadgeProps {
  variant?: 'full' | 'compact' | 'inline'
}

export function CleanEnergyBadge({ variant = 'compact' }: CleanEnergyBadgeProps) {
  if (variant === 'inline') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{
          background: zamgasTheme.colors.primary.mintLight,
          color: zamgasTheme.colors.primary.forestDark,
          border: `1px solid ${zamgasTheme.colors.primary.forest}`,
        }}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Clean Energy Certified</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-2 p-2.5 rounded-lg"
        style={{
          background: zamgasTheme.colors.neutral[50],
          border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: zamgasTheme.gradients.eco,
            boxShadow: zamgasTheme.shadows.ecoGlow,
          }}
        >
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold leading-tight"
            style={{ color: zamgasTheme.colors.semantic.textPrimary }}
          >
            Certified Clean
          </p>
          <p
            className="text-xs leading-tight"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            Eco-approved
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{
        background: zamgasTheme.colors.neutral[50],
        border: `2px solid ${zamgasTheme.colors.primary.forest}`,
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{
          background: zamgasTheme.gradients.eco,
          boxShadow: zamgasTheme.shadows.ecoGlow,
        }}
      >
        <Award className="h-8 w-8 text-white" />
      </div>
      <h4
        className="font-bold text-sm mb-1"
        style={{
          color: zamgasTheme.colors.semantic.textPrimary,
          fontFamily: zamgasTheme.typography.fontFamily.display,
        }}
      >
        Clean Energy Certified
      </h4>
      <p
        className="text-xs leading-relaxed"
        style={{ color: zamgasTheme.colors.semantic.textSecondary }}
      >
        Verified by Environmental Standards
      </p>
      <div className="flex items-center justify-center gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: zamgasTheme.colors.accent.teal }}
          />
        ))}
      </div>
    </div>
  )
}
