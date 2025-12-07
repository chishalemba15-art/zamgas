'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Package, MessageCircle, User } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/customer/dashboard',
      active: pathname === '/customer/dashboard',
    },
    {
      label: 'Orders',
      icon: Package,
      path: '/customer/orders',
      active: pathname === '/customer/orders',
    },
    {
      label: 'Support',
      icon: MessageCircle,
      path: '/customer/support',
      active: pathname === '/customer/support',
    },
    {
      label: 'Profile',
      icon: User,
      path: '/customer/profile',
      active: pathname === '/customer/profile',
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-40"
      style={{
        borderColor: zamgasTheme.colors.neutral[200],
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95"
            >
              {/* Active indicator bar */}
              {item.active && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-b-full"
                  style={{
                    background: zamgasTheme.gradients.primary,
                  }}
                />
              )}

              {/* Icon */}
              <Icon
                className="h-6 w-6 mb-1 transition-colors"
                style={{
                  color: item.active
                    ? zamgasTheme.colors.primary.forest
                    : zamgasTheme.colors.semantic.textSecondary,
                  strokeWidth: item.active ? 2.5 : 2,
                }}
              />

              {/* Label */}
              <span
                className="text-xs font-medium transition-colors"
                style={{
                  color: item.active
                    ? zamgasTheme.colors.primary.forest
                    : zamgasTheme.colors.semantic.textSecondary,
                  fontFamily: zamgasTheme.typography.fontFamily.body,
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
