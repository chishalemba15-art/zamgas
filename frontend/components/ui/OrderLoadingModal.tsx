'use client'

import { Loader2, Package, Flame } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface OrderLoadingModalProps {
  isOpen: boolean
}

export function OrderLoadingModal({ isOpen }: OrderLoadingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{
          background: 'white',
        }}
      >
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Spinning outer circle */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center animate-spin"
              style={{
                background: `conic-gradient(from 0deg, ${zamgasTheme.colors.primary.forest}, ${zamgasTheme.colors.secondary.amber}, ${zamgasTheme.colors.primary.forest})`,
                animation: 'spin 2s linear infinite',
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'white' }}
              >
                <Flame
                  className="h-10 w-10 animate-pulse"
                  style={{ color: zamgasTheme.colors.primary.forest }}
                />
              </div>
            </div>

            {/* Floating packages */}
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Package
                className="h-6 w-6"
                style={{ color: zamgasTheme.colors.secondary.amber }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: zamgasTheme.colors.trust.navy }}
          >
            Placing Your Order
          </h2>
          <p
            className="text-base leading-relaxed mb-4"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            Please wait while we process your order...
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  background: zamgasTheme.colors.primary.forest,
                  animationDelay: `${i * 200}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
