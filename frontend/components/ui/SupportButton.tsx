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
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Support Menu - Dark Theme */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-200"
          style={{
            background: zamgasTheme.colors.premium.burgundy,
            border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
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
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95"
                style={{
                  background: zamgasTheme.colors.premium.burgundyLight,
                }}
              >
                <span className="text-xl">{option.icon}</span>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: zamgasTheme.colors.premium.gold,
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

      {/* FAB Button - Smaller, Dark Theme */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50"
        style={{
          background: zamgasTheme.colors.premium.burgundy,
          border: `2px solid ${zamgasTheme.colors.premium.gold}`,
          boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.burgundy}80`,
        }}
      >
        {isOpen ? (
          <X className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
        ) : (
          <MessageCircle className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
        )}
      </button>
    </>
  )
}
