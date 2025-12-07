import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'

describe('AuthStore - Admin Functions', () => {
  beforeEach(() => {
    // Clear the store before each test
    const store = useAuthStore.getState()
    store.clearAuth()
  })

  describe('isAdmin', () => {
    it('should return false when user is not authenticated', () => {
      const { isAdmin } = useAuthStore.getState()
      expect(isAdmin()).toBe(false)
    })

    it('should return false when user has no admin_role', () => {
      const { setAuth, isAdmin } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'customer@test.com',
          name: 'John',
          phone_number: '1234567890',
          user_type: 'customer',
        },
        'token123'
      )
      expect(isAdmin()).toBe(false)
    })

    it('should return true when user has admin_role', () => {
      const { setAuth, isAdmin } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
        },
        'token123'
      )
      expect(isAdmin()).toBe(true)
    })

    it('should return true for manager admin role', () => {
      const { setAuth, isAdmin } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'manager@test.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
        },
        'token123'
      )
      expect(isAdmin()).toBe(true)
    })
  })

  describe('getAdminRole', () => {
    it('should return null for non-admin users', () => {
      const { setAuth, getAdminRole } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'customer@test.com',
          name: 'John',
          phone_number: '1234567890',
          user_type: 'customer',
        },
        'token123'
      )
      expect(getAdminRole()).toBe(null)
    })

    it('should return the admin role for admin users', () => {
      const { setAuth, getAdminRole } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
        },
        'token123'
      )
      expect(getAdminRole()).toBe('super_admin')
    })
  })

  describe('hasPermission', () => {
    it('should return false when user has no permissions', () => {
      const { setAuth, hasPermission } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'analyst',
          admin_permissions: [],
        },
        'token123'
      )
      expect(hasPermission('view_users')).toBe(false)
    })

    it('should return true when user has the specific permission', () => {
      const { setAuth, hasPermission } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'edit_users', 'delete_users'],
        },
        'token123'
      )
      expect(hasPermission('view_users')).toBe(true)
      expect(hasPermission('edit_users')).toBe(true)
      expect(hasPermission('delete_users')).toBe(true)
      expect(hasPermission('view_analytics')).toBe(false)
    })

    it('should return false when user has no admin_permissions field', () => {
      const { setAuth, hasPermission } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'analyst',
        },
        'token123'
      )
      expect(hasPermission('view_users')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return false when user has none of the permissions', () => {
      const { setAuth, hasAnyPermission } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'analyst',
          admin_permissions: ['view_orders', 'view_analytics'],
        },
        'token123'
      )
      expect(hasAnyPermission(['delete_users', 'edit_users'])).toBe(false)
    })

    it('should return true when user has at least one of the permissions', () => {
      const { setAuth, hasAnyPermission } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'view_orders'],
        },
        'token123'
      )
      expect(hasAnyPermission(['view_users', 'delete_users'])).toBe(true)
      expect(hasAnyPermission(['view_orders', 'delete_orders'])).toBe(true)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return false when user does not have all permissions', () => {
      const { setAuth, hasAllPermissions } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'edit_users'],
        },
        'token123'
      )
      expect(hasAllPermissions(['view_users', 'delete_users'])).toBe(false)
    })

    it('should return true when user has all permissions', () => {
      const { setAuth, hasAllPermissions } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
          admin_permissions: ['view_users', 'edit_users', 'delete_users', 'view_orders', 'view_analytics'],
        },
        'token123'
      )
      expect(hasAllPermissions(['view_users', 'edit_users', 'delete_users'])).toBe(true)
    })
  })

  describe('Auth persistence', () => {
    it('should persist auth state to localStorage', () => {
      const { setAuth } = useAuthStore.getState()
      const user = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin',
        phone_number: '1234567890',
        user_type: 'admin' as const,
        admin_role: 'super_admin' as const,
      }

      setAuth(user, 'token123')

      expect(localStorage.getItem('authToken')).toBe('token123')
      const storedUser = localStorage.getItem('user')
      expect(storedUser).toBeTruthy()
      expect(JSON.parse(storedUser!).admin_role).toBe('super_admin')
    })

    it('should clear auth from localStorage on logout', () => {
      const { setAuth, clearAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
        },
        'token123'
      )

      expect(localStorage.getItem('authToken')).toBe('token123')

      clearAuth()

      expect(localStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })
})
