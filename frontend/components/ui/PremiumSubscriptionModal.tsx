'use client'

import { Crown, Check, Sparkles, X } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface PremiumSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe: () => void
}

export function PremiumSubscriptionModal({ isOpen, onClose, onSubscribe }: PremiumSubscriptionModalProps) {
  if (!isOpen) return null

  const features = [
    'Browse all available providers',
    'Compare prices across providers',
    'Access to exclusive deals',
    'Priority customer support',
    'Faster delivery options',
    'Monthly savings on orders',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 fade-in duration-300"
        style={{
          background: 'white',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Premium Badge */}
        <div className="flex justify-center mb-4">
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${zamgasTheme.colors.secondary.amberLight} 0%, ${zamgasTheme.colors.secondary.amber} 100%)`,
              boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)',
            }}
          >
            <Crown className="h-12 w-12 text-white" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: zamgasTheme.colors.trust.navy }}
          >
            Upgrade to Premium
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            Unlock access to all providers and exclusive features
          </p>
        </div>

        {/* Pricing */}
        <div
          className="mb-6 p-6 rounded-2xl text-center"
          style={{
            background: `linear-gradient(135deg, ${zamgasTheme.colors.primary.forest}15 0%, ${zamgasTheme.colors.secondary.amber}15 100%)`,
            border: `2px solid ${zamgasTheme.colors.secondary.amber}`,
          }}
        >
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span
              className="text-4xl sm:text-5xl font-bold"
              style={{ color: zamgasTheme.colors.primary.forest }}
            >
              K 49
            </span>
            <span
              className="text-lg"
              style={{ color: zamgasTheme.colors.semantic.textSecondary }}
            >
              /month
            </span>
          </div>
          <p
            className="text-sm"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            Cancel anytime, no commitment
          </p>
        </div>

        {/* Features List */}
        <div className="mb-6 space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: zamgasTheme.colors.secondary.amber }}
              >
                <Check
                  className="h-4 w-4"
                  style={{ color: 'white' }}
                />
              </div>
              <p
                className="text-sm sm:text-base"
                style={{ color: zamgasTheme.colors.semantic.textPrimary }}
              >
                {feature}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onSubscribe}
            className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 text-base sm:text-lg"
            style={{
              background: `linear-gradient(135deg, ${zamgasTheme.colors.primary.forest} 0%, ${zamgasTheme.colors.primary.forestLight} 100%)`,
              boxShadow: zamgasTheme.shadows.large,
            }}
          >
            Start Premium Trial - Free for 7 Days
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-medium transition-colors text-sm sm:text-base"
            style={{
              background: zamgasTheme.colors.semantic.cardBg,
              color: zamgasTheme.colors.semantic.textSecondary,
            }}
          >
            Maybe Later
          </button>
        </div>

        {/* Trust Badge */}
        <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: zamgasTheme.colors.neutral[40] }}>
          <p
            className="text-xs sm:text-sm"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            🔒 Secure payment • Cancel anytime • Trusted by 1,000+ customers
          </p>
        </div>
      </div>
    </div>
  )
}
