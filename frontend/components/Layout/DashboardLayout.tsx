'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, LogOut, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/lib/api'
import { BottomNavigation } from './BottomNavigation'
import { SupportButton } from '@/components/ui/SupportButton'
import { zamgasTheme } from '@/lib/zamgas-theme'
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
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(180deg, ${zamgasTheme.colors.premium.burgundyDark} 0%, ${zamgasTheme.colors.premium.burgundy} 100%)` 
      }}
    >
      {/* Top Navigation - Premium Dark Theme */}
      <nav 
        className="sticky top-0 z-50 shadow-lg"
        style={{ 
          backgroundColor: zamgasTheme.colors.premium.burgundy,
          borderBottom: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => router.push('/')}
            >
              <div 
                className="rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-105"
                style={{ 
                  boxShadow: `0 4px 12px ${zamgasTheme.colors.premium.red}40`
                }}
              >
                <Image 
                  src="/app-icon.png" 
                  alt="ZAMGAS Logo" 
                  width={44} 
                  height={44}
                  className="object-cover"
                />
              </div>
              <span 
                className="text-xl font-bold tracking-tight"
                style={{ 
                  color: zamgasTheme.colors.premium.gold,
                  fontFamily: zamgasTheme.typography.fontFamily.display
                }}
              >
                ZAMGAS
              </span>
            </div>

            {/* Right Section - User & Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button 
                className="relative p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: `${zamgasTheme.colors.premium.burgundyLight}` }}
              >
                <Bell className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gray }} />
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: zamgasTheme.colors.premium.red }}
                >
                  2
                </span>
              </button>

              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3">
                <div 
                  className="rounded-full p-2"
                  style={{ backgroundColor: zamgasTheme.colors.premium.burgundyLight }}
                >
                  <User className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                </div>
                <div>
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: '#FFFFFF' }}
                  >
                    {user?.name || 'Guest'}
                  </p>
                  <p 
                    className="text-xs capitalize"
                    style={{ color: zamgasTheme.colors.premium.gray }}
                  >
                    {user?.user_type || 'customer'}
                  </p>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: zamgasTheme.colors.premium.burgundyLight,
                  color: zamgasTheme.colors.premium.gray
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Content with bottom padding for mobile nav */}
        <div className="pb-24 md:pb-0">{children}</div>
      </div>

      {/* Bottom Navigation (Mobile only) */}
      {user?.user_type === 'customer' && <BottomNavigation />}

      {/* Support FAB (Customer only) */}
      {user?.user_type === 'customer' && <SupportButton />}
    </div>
  )
}

