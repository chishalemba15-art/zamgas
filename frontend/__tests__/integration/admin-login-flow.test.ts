import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/lib/api'

vi.mock('@/lib/api')

describe('Admin Login Flow - Integration Tests', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Complete Admin Authentication Flow', () => {
    it('should complete full super admin login flow', async () => {
      // Step 1: User provides credentials
      const credentials = {
        email: 'admin@zamgas.com',
        password: 'secure_password_123',
      }

      // Step 2: API call is made
      const mockAdminResponse = {
        user: {
          id: 'admin-001',
          email: 'admin@zamgas.com',
          name: 'Super Admin',
          phone_number: '+234801234567',
          user_type: 'admin' as const,
          admin_role: 'super_admin' as const,
          admin_permissions: [
            'view_users',
            'edit_users',
            'delete_users',
            'view_orders',
            'edit_orders',
            'view_analytics',
            'edit_analytics',
            'view_providers',
            'edit_providers',
            'view_couriers',
            'edit_couriers',
            'system_settings',
            'view_reports',
            'export_data',
          ],
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValue(mockAdminResponse)

      // Step 3: Call API through SDK
      const response = await api.authAPI.signIn(credentials.email, credentials.password)

      // Step 4: Store authentication state
      const authStore = useAuthStore.getState()
      authStore.setAuth(response.user, response.token)

      // Step 5: Verify state
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.user?.admin_role).toBe('super_admin')
      expect(authStore.token).toBe(mockAdminResponse.token)
      expect(authStore.isAdmin()).toBe(true)

      // Step 6: Verify permissions
      expect(authStore.hasPermission('view_users')).toBe(true)
      expect(authStore.hasPermission('delete_users')).toBe(true)
      expect(authStore.hasPermission('system_settings')).toBe(true)

      // Step 7: Verify persistence
      expect(localStorage.getItem('authToken')).toBe(mockAdminResponse.token)
      const storedUser = JSON.parse(localStorage.getItem('user')!)
      expect(storedUser.admin_role).toBe('super_admin')
    })

    it('should complete full manager admin login flow with limited permissions', async () => {
      const authStore = useAuthStore.getState()

      const mockManagerResponse = {
        user: {
          id: 'manager-001',
          email: 'manager@zamgas.com',
          name: 'Manager Admin',
          phone_number: '+234802234567',
          user_type: 'admin' as const,
          admin_role: 'manager' as const,
          admin_permissions: [
            'view_users',
            'edit_users',
            'view_orders',
            'edit_orders',
            'view_providers',
            'view_couriers',
          ],
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValueOnce(mockManagerResponse)

      const response = await api.authAPI.signIn('manager@zamgas.com', 'password')
      authStore.setAuth(response.user, response.token)

      expect(authStore.isAdmin()).toBe(true)
      expect(authStore.getAdminRole()).toBe('manager')

      // Manager has specific permissions
      expect(authStore.hasPermission('view_users')).toBe(true)
      expect(authStore.hasPermission('edit_users')).toBe(true)

      // Manager does not have these permissions
      expect(authStore.hasPermission('delete_users')).toBe(false)
      expect(authStore.hasPermission('system_settings')).toBe(false)
    })

    it('should complete analyst admin login flow', async () => {
      const authStore = useAuthStore.getState()

      const mockAnalystResponse = {
        user: {
          id: 'analyst-001',
          email: 'analyst@zamgas.com',
          name: 'Analyst Admin',
          phone_number: '+234803234567',
          user_type: 'admin' as const,
          admin_role: 'analyst' as const,
          admin_permissions: ['view_analytics', 'view_reports', 'export_data'],
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValueOnce(mockAnalystResponse)

      const response = await api.authAPI.signIn('analyst@zamgas.com', 'password')
      authStore.setAuth(response.user, response.token)

      expect(authStore.isAdmin()).toBe(true)
      expect(authStore.getAdminRole()).toBe('analyst')

      // Analyst has analytics permissions
      expect(authStore.hasPermission('view_analytics')).toBe(true)
      expect(authStore.hasPermission('view_reports')).toBe(true)

      // Analyst does not have user management permissions
      expect(authStore.hasPermission('view_users')).toBe(false)
      expect(authStore.hasPermission('edit_users')).toBe(false)
    })

    it('should complete support admin login flow', async () => {
      const authStore = useAuthStore.getState()

      const mockSupportResponse = {
        user: {
          id: 'support-001',
          email: 'support@zamgas.com',
          name: 'Support Admin',
          phone_number: '+234804234567',
          user_type: 'admin' as const,
          admin_role: 'support' as const,
          admin_permissions: ['resolve_disputes', 'view_orders', 'edit_orders', 'view_users'],
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValueOnce(mockSupportResponse)

      const response = await api.authAPI.signIn('support@zamgas.com', 'password')
      authStore.setAuth(response.user, response.token)

      expect(authStore.isAdmin()).toBe(true)
      expect(authStore.getAdminRole()).toBe('support')

      // Support has dispute and order permissions
      expect(authStore.hasPermission('resolve_disputes')).toBe(true)
      expect(authStore.hasPermission('view_orders')).toBe(true)
    })
  })

  describe('Permission Checking Methods', () => {
    beforeEach(() => {
      const authStore = useAuthStore.getState()
      authStore.setAuth(
        {
          id: '1',
          email: 'manager@zamgas.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'edit_users', 'view_orders', 'edit_orders'],
        },
        'token123'
      )
    })

    it('should check single permission correctly', () => {
      const authStore = useAuthStore.getState()
      expect(authStore.hasPermission('view_users')).toBe(true)
      expect(authStore.hasPermission('delete_users')).toBe(false)
    })

    it('should check any permission (OR logic)', () => {
      const authStore = useAuthStore.getState()
      // Has at least one
      expect(authStore.hasAnyPermission(['view_users', 'delete_users'])).toBe(true)
      expect(authStore.hasAnyPermission(['view_orders', 'edit_orders'])).toBe(true)
      // Has none
      expect(authStore.hasAnyPermission(['delete_users', 'delete_orders'])).toBe(false)
    })

    it('should check all permissions (AND logic)', () => {
      const authStore = useAuthStore.getState()
      // Has all
      expect(authStore.hasAllPermissions(['view_users', 'edit_users'])).toBe(true)
      // Missing one
      expect(authStore.hasAllPermissions(['view_users', 'delete_users'])).toBe(false)
    })
  })

  describe('Logout and Session Cleanup', () => {
    it('should properly clear admin session on logout', () => {
      // Login first
      const authStore = useAuthStore.getState()
      authStore.setAuth(
        {
          id: '1',
          email: 'admin@zamgas.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
          admin_permissions: ['view_users'],
        },
        'admin-token-123'
      )

      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.isAdmin()).toBe(true)

      // Logout
      authStore.clearAuth()

      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.user).toBeNull()
      expect(authStore.token).toBeNull()
      expect(authStore.isAdmin()).toBe(false)
      expect(authStore.getAdminRole()).toBeNull()

      // Verify localStorage is cleared
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should reset permissions on logout', () => {
      const authStore = useAuthStore.getState()

      authStore.setAuth(
        {
          id: '1',
          email: 'manager@zamgas.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'edit_users'],
        },
        'token123'
      )

      expect(authStore.hasPermission('view_users')).toBe(true)

      authStore.clearAuth()

      // After logout, no permissions
      expect(authStore.hasPermission('view_users')).toBe(false)
      expect(authStore.hasAnyPermission(['view_users', 'edit_users'])).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle failed login attempts', async () => {
      vi.mocked(api.authAPI.signIn).mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: 'Invalid credentials',
          },
        },
      })

      try {
        await api.authAPI.signIn('admin@zamgas.com', 'wrong_password')
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.error).toBe('Invalid credentials')
      }

      const authStore = useAuthStore.getState()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should handle network errors', async () => {
      vi.mocked(api.authAPI.signIn).mockRejectedValueOnce(new Error('Network error'))

      try {
        await api.authAPI.signIn('admin@zamgas.com', 'password')
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toBe('Network error')
      }

      const authStore = useAuthStore.getState()
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('Cross-Tab Session Sync', () => {
    it('should maintain consistent state across store instances', () => {
      const store1 = useAuthStore.getState()

      store1.setAuth(
        {
          id: '1',
          email: 'admin@zamgas.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
          admin_permissions: ['view_users'],
        },
        'token123'
      )

      // Get another reference to the store
      const store2 = useAuthStore.getState()

      expect(store2.isAdmin()).toBe(true)
      expect(store2.user?.admin_role).toBe('super_admin')
      expect(store2.token).toBe('token123')
    })
  })
})
