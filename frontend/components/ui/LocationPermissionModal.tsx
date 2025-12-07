'use client'

import { useState } from 'react'
import { MapPin, X, Navigation } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface LocationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onAllow: () => void
  onDeny: () => void
}

export function LocationPermissionModal({ isOpen, onClose, onAllow, onDeny }: LocationPermissionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{
          background: 'white',
          boxShadow: zamgasTheme.shadows.large,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: zamgasTheme.gradients.primary,
              boxShadow: zamgasTheme.shadows.medium,
            }}
          >
            <Navigation className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: zamgasTheme.colors.trust.navy }}
          >
            Enable Location Services
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            We need your location to find the nearest LPG gas providers and give you the best delivery experience.
          </p>
        </div>

        {/* Benefits List */}
        <div className="mb-6 space-y-3">
          {[
            'Find the closest providers',
            'Get accurate delivery times',
            'Better service recommendations',
          ].map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: zamgasTheme.colors.secondary.amber + '40' }}
              >
                <MapPin
                  className="h-4 w-4"
                  style={{ color: zamgasTheme.colors.primary.forest }}
                />
              </div>
              <p
                className="text-sm"
                style={{ color: zamgasTheme.colors.semantic.textPrimary }}
              >
                {benefit}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onAllow}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: zamgasTheme.gradients.primary,
              boxShadow: zamgasTheme.shadows.medium,
            }}
          >
            Allow Location Access
          </button>
          <button
            onClick={onDeny}
            className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
            style={{
              background: zamgasTheme.colors.semantic.cardBg,
              color: zamgasTheme.colors.semantic.textSecondary,
            }}
          >
            Maybe Later
          </button>
        </div>

        {/* Privacy Note */}
        <p
          className="text-xs text-center mt-4"
          style={{ color: zamgasTheme.colors.semantic.textSecondary }}
        >
          Your location is only used to find nearby providers. We respect your privacy.
        </p>
      </div>
    </div>
  )
}
