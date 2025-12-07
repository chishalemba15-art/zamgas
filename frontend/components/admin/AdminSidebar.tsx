'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: string
  requiredRole?: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Providers', href: '/admin/providers', icon: '🏪' },
  { label: 'Couriers', href: '/admin/couriers', icon: '🚚' },
  { label: 'Orders', href: '/admin/orders', icon: '📦' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
  { label: 'Reports', href: '/admin/reports', icon: '📋' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { getAdminRole, hasPermission } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const adminRole = getAdminRole()

  const filteredItems = navItems.filter((item) => {
    if (!item.requiredRole) return true
    return item.requiredRole.includes(adminRole || '')
  })

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 z-40
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-20 lg:pt-0
        `}
      >
        {/* Sidebar header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-brand-600">ZamGas</h1>
          <p className="text-sm text-gray-600 mt-1">Admin Dashboard</p>
        </div>

        {/* Role badge */}
        <div className="px-6 py-4 bg-gray-50">
          <p className="text-xs text-gray-600 mb-1">Role</p>
          <div className="inline-block px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">
            {adminRole?.replace(/_/g, ' ').toUpperCase() || 'Unknown'}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {filteredItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive(item.href)
                        ? 'bg-brand-50 text-brand-700 font-medium border-l-4 border-brand-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Admin Panel v1.0
          </p>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-64" />
    </>
  )
}
