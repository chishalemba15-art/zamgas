'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Bell, LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'

export function AdminHeader() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    clearAuth()
    toast.success('Logged out successfully')
    router.push('/auth/signin')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 lg:left-64">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - search (placeholder) */}
        <div className="hidden sm:block flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Right side - user menu */}
        <div className="flex items-center gap-6 ml-auto">
          {/* Notification bell */}
          <button className="relative text-gray-600 hover:text-gray-900">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-600">{user?.email}</p>
            </div>

            {/* User avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
