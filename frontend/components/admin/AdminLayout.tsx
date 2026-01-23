'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const { user, isAuthenticated, isAdmin } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    // Check if we have auth data in localStorage
    const hasStoredAuth = typeof window !== 'undefined' &&
      (localStorage.getItem('authToken') !== null || localStorage.getItem('user') !== null)

    // Give the store a moment to hydrate from localStorage
    const timer = setTimeout(() => {
      setIsHydrated(true)

      // If no auth after hydration, redirect to login
      if (!hasStoredAuth && !isAuthenticated) {
        router.push('/admin/login')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, router])

  // Show loading while hydrating auth state
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Protect admin routes - redirect if not authenticated or not admin
  if (!isAuthenticated || !user) {
    // Not authenticated - redirect to login
    if (typeof window !== 'undefined') {
      router.push('/admin/login')
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Check if user has admin role
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin permission to access this page.</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Login as Admin
            </button>
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Go to Customer Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <AdminHeader />

        {/* Main content */}
        <main className="flex-1 overflow-auto pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
