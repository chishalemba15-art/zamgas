'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface SupportOption {
  label: string
  action: () => void
  icon: string
}

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false)

  const supportOptions: SupportOption[] = [
    {
      label: 'Contact Provider',
      action: () => {
        // TODO: Implement contact provider
        alert('Contact provider functionality')
      },
      icon: '📞',
    },
    {
      label: 'Track Order',
      action: () => {
        // TODO: Navigate to orders with tracking
        alert('Track order functionality')
      },
      icon: '📦',
    },
    {
      label: 'Help & FAQs',
      action: () => {
        // TODO: Open FAQ modal
        alert('FAQ functionality')
      },
      icon: '❓',
    },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Support Menu */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 bg-white rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-200"
          style={{
            border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
          }}
        >
          <div className="p-3 space-y-2 min-w-[200px]">
            {supportOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.action()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{
                  background: zamgasTheme.colors.neutral[50],
                }}
              >
                <span className="text-2xl">{option.icon}</span>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: zamgasTheme.colors.semantic.textPrimary,
                    fontFamily: zamgasTheme.typography.fontFamily.body,
                  }}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50"
        style={{
          background: zamgasTheme.gradients.primary,
          boxShadow: zamgasTheme.shadows.large,
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </>
  )
}
