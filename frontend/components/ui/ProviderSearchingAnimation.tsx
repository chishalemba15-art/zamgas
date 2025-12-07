'use client'

import { Search, MapPin, Zap, Loader2 } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { useEffect, useState } from 'react'

interface ProviderSearchingAnimationProps {
  isSearching: boolean
}

export function ProviderSearchingAnimation({ isSearching }: ProviderSearchingAnimationProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isSearching) return

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isSearching])

  if (!isSearching) return null

  return (
    <div
      className="p-4 rounded-xl border-2 animate-pulse"
      style={{
        background: zamgasTheme.gradients.primarySubtle,
        borderColor: zamgasTheme.colors.primary.forest,
        boxShadow: zamgasTheme.shadows.medium,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Animated icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Loader2 className="h-5 w-5 text-white animate-spin" />
          
          {/* Ripple effect */}
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: 'rgba(255, 255, 255, 0.3)',
            }}
          />
        </div>

        {/* Message */}
        <div className="flex-1 text-white">
          <p className="font-semibold text-sm" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
            Finding best provider{dots}
          </p>
          <p className="text-xs opacity-90">
            Analyzing location and availability
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                animation: `pulse 1.5s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
