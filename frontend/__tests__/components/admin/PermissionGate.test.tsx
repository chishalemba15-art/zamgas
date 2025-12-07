import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PermissionGate } from '@/components/admin/PermissionGate'
import { useAuthStore } from '@/store/authStore'

describe('PermissionGate Component', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  describe('Super Admin Bypass', () => {
    it('should render children for super admin regardless of permissions', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
          admin_permissions: ['view_users'],
        },
        'token123'
      )

      render(
        <PermissionGate permissions="delete_all_users">
          <div>Restricted Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Restricted Content')).toBeTruthy()
    })

    it('should render children for super admin even without any permissions', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
          admin_permissions: [],
        },
        'token123'
      )

      render(
        <PermissionGate permissions="any_permission">
          <div>Restricted Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Restricted Content')).toBeTruthy()
    })
  })

  describe('No Permissions Required', () => {
    it('should render children when no permissions specified', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'user@test.com',
          name: 'User',
          phone_number: '1234567890',
          user_type: 'customer',
        },
        'token123'
      )

      render(<PermissionGate>
        <div>Public Content</div>
      </PermissionGate>)

      expect(screen.getByText('Public Content')).toBeTruthy()
    })
  })

  describe('Single Permission Check', () => {
    it('should render children when user has the required permission', () => {
      useAuthStore.getState().setAuth(
        {
          id: '1',
          email: 'manager@test.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'edit_users'],
        },
        'token123'
      )

      render(
        <PermissionGate permissions="edit_users">
          <div>Edit Users Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Edit Users Content')).toBeTruthy()
    })

    it('should render fallback when user lacks the required permission', () => {
      useAuthStore.getState().setAuth(
        {
          id: '1',
          email: 'analyst@test.com',
          name: 'Analyst',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'analyst',
          admin_permissions: ['view_analytics'],
        },
        'token123'
      )

      render(
        <PermissionGate
          permissions="delete_users"
          fallback={<div>Unauthorized</div>}
        >
          <div>Delete Users Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Unauthorized')).toBeTruthy()
      expect(screen.queryByText('Delete Users Content')).toBeNull()
    })

    it('should render null fallback by default', () => {
      useAuthStore.getState().setAuth(
        {
          id: '1',
          email: 'user@test.com',
          name: 'User',
          phone_number: '1234567890',
          user_type: 'customer',
        },
        'token123'
      )

      const { container } = render(
        <PermissionGate permissions="admin_only">
          <div>Admin Content</div>
        </PermissionGate>
      )

      expect(screen.queryByText('Admin Content')).toBeNull()
      expect(container.firstChild?.childNodes.length).toBe(0)
    })
  })

  describe('Multiple Permissions - Any Match (OR)', () => {
    it('should render children when user has any of the required permissions', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'manager@test.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'view_orders'],
        },
        'token123'
      )

      render(
        <PermissionGate permissions={['edit_users', 'view_users']} requireAll={false}>
          <div>Users Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Users Content')).toBeTruthy()
    })

    it('should render children when user has the second permission', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'analyst@test.com',
          name: 'Analyst',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'analyst',
          admin_permissions: ['view_analytics', 'view_reports'],
        },
        'token123'
      )

      render(
        <PermissionGate permissions={['delete_users', 'view_reports']} requireAll={false}>
          <div>Authorized Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Authorized Content')).toBeTruthy()
    })

    it('should render fallback when user has none of the permissions', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'support@test.com',
          name: 'Support',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'support',
          admin_permissions: ['resolve_disputes'],
        },
        'token123'
      )

      render(
        <PermissionGate
          permissions={['edit_users', 'delete_users']}
          requireAll={false}
          fallback={<div>No Access</div>}
        >
          <div>Admin Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('No Access')).toBeTruthy()
    })
  })

  describe('Multiple Permissions - All Match (AND)', () => {
    it('should render children when user has all required permissions', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'manager@test.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'edit_users', 'delete_users'],
        },
        'token123'
      )

      render(
        <PermissionGate
          permissions={['view_users', 'edit_users']}
          requireAll={true}
        >
          <div>Bulk Action Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Bulk Action Content')).toBeTruthy()
    })

    it('should render fallback when user lacks one required permission', () => {
      useAuthStore.getState().setAuth(
        {
          id: '1',
          email: 'manager@test.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'view_orders'],
        },
        'token123'
      )

      render(
        <PermissionGate
          permissions={['view_users', 'edit_users']}
          requireAll={true}
          fallback={<div>Insufficient Permissions</div>}
        >
          <div>Edit Users Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Insufficient Permissions')).toBeTruthy()
      expect(screen.queryByText('Edit Users Content')).toBeNull()
    })

    it('should render fallback when user has no matching permissions', () => {
      useAuthStore.getState().setAuth(
        {
          id: '1',
          email: 'analyst@test.com',
          name: 'Analyst',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'analyst',
          admin_permissions: ['view_analytics'],
        },
        'token123'
      )

      render(
        <PermissionGate
          permissions={['view_users', 'edit_users', 'delete_users']}
          requireAll={true}
          fallback={<div>Admin Only</div>}
        >
          <div>Admin Content</div>
        </PermissionGate>
      )

      expect(screen.getByText('Admin Only')).toBeTruthy()
    })
  })

  describe('Role-Based Access Control', () => {
    it('should grant edit access to manager role', () => {
      useAuthStore.getState().setAuth(
        {
          id: '1',
          email: 'manager@test.com',
          name: 'Manager',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'manager',
          admin_permissions: ['view_users', 'edit_users', 'view_orders'],
        },
        'token123'
      )

      render(
        <PermissionGate permissions="edit_users">
          <div>Edit Users</div>
        </PermissionGate>
      )
      expect(screen.getByText('Edit Users')).toBeTruthy()
    })

    it('should deny edit access to analyst role', () => {
      useAuthStore.getState().clearAuth()
      useAuthStore.getState().setAuth(
        {
          id: '2',
          email: 'analyst@test.com',
          name: 'Analyst',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'analyst',
          admin_permissions: ['view_analytics', 'view_reports'],
        },
        'token124'
      )

      render(
        <PermissionGate permissions="edit_users" fallback={<div>No Access</div>}>
          <div>Edit Users</div>
        </PermissionGate>
      )
      expect(screen.getByText('No Access')).toBeTruthy()
    })
  })
})
