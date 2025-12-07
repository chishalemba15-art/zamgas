import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
  // Admin-specific getters
  isAdmin: () => boolean
  getAdminRole: () => string | null
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
          localStorage.setItem('user', JSON.stringify(user))
          // Also set cookie for middleware
          document.cookie = `authToken=${token}; path=/; max-age=604800; SameSite=Lax`
        }
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          // Also clear cookie
          document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      // Admin helper methods
      isAdmin: () => {
        const state = get()
        return !!(state.user && state.user.admin_role)
      },

      getAdminRole: () => {
        const state = get()
        return state.user?.admin_role || null
      },

      hasPermission: (permission: string) => {
        const state = get()
        if (!state.user?.admin_permissions) return false
        return state.user.admin_permissions.includes(permission)
      },

      hasAnyPermission: (permissions: string[]) => {
        const state = get()
        if (!state.user?.admin_permissions) return false
        return permissions.some((p) => state.user?.admin_permissions?.includes(p))
      },

      hasAllPermissions: (permissions: string[]) => {
        const state = get()
        if (!state.user?.admin_permissions) return false
        return permissions.every((p) => state.user?.admin_permissions?.includes(p))
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
