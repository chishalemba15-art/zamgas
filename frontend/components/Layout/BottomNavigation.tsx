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
      className="fixed bottom-0 left-0 right-0 md:hidden z-40"
      style={{
        backgroundColor: zamgasTheme.colors.premium.burgundy,
        borderTop: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
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
              {/* Active indicator dot */}
              {item.active && (
                <div
                  className="absolute top-1 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: zamgasTheme.colors.premium.red,
                    boxShadow: `0 0 8px ${zamgasTheme.colors.premium.red}`,
                  }}
                />
              )}

              {/* Icon */}
              <Icon
                className="h-6 w-6 mb-1 transition-colors"
                style={{
                  color: item.active
                    ? zamgasTheme.colors.premium.gold
                    : zamgasTheme.colors.premium.gray,
                  strokeWidth: item.active ? 2.5 : 2,
                }}
              />

              {/* Label */}
              <span
                className="text-xs font-medium transition-colors"
                style={{
                  color: item.active
                    ? zamgasTheme.colors.premium.gold
                    : zamgasTheme.colors.premium.gray,
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

