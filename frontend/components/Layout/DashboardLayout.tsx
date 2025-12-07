'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/lib/api'
import { BottomNavigation } from './BottomNavigation'
import { SupportButton } from '@/components/ui/SupportButton'
import toast from 'react-hot-toast'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await authAPI.signOut()
      clearAuth()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      // Even if API call fails, clear local auth
      clearAuth()
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="bg-brand-600 rounded-lg p-2">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900">ZamGas</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="bg-brand-100 rounded-full p-2">
                  <User className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                  <p className="text-xs text-neutral-500 capitalize">{user?.user_type}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-danger-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Content with bottom padding for mobile nav */}
        <div className="pb-20 md:pb-0">{children}</div>
      </div>

      {/* Bottom Navigation (Mobile only) */}
      {user?.user_type === 'customer' && <BottomNavigation />}

      {/* Support FAB (Customer only) */}
      {user?.user_type === 'customer' && <SupportButton />}
    </div>
  )
}
