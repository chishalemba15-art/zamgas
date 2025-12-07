import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuthStore } from '@/store/authStore'

// Mock the child components
vi.mock('@/components/admin/AdminSidebar', () => ({
  AdminSidebar: () => <div>Admin Sidebar</div>,
}))

vi.mock('@/components/admin/AdminHeader', () => ({
  AdminHeader: () => <div>Admin Header</div>,
}))

describe('AdminLayout - Access Control', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  describe('Non-admin Access', () => {
    it('should show access denied for non-authenticated users', () => {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()

      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      expect(screen.getByText('Access Denied')).toBeTruthy()
      expect(screen.getByText("You don't have permission to access this page.")).toBeTruthy()
      expect(screen.getByRole('button', { name: /go to sign in/i })).toBeTruthy()
    })

    it('should show access denied for non-admin authenticated users', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'customer@test.com',
          name: 'Customer',
          phone_number: '1234567890',
          user_type: 'customer',
        },
        'token123'
      )

      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      expect(screen.getByText('Access Denied')).toBeTruthy()
      expect(screen.queryByText('Admin Sidebar')).toBeNull()
      expect(screen.queryByText('Dashboard Content')).toBeNull()
    })

    it('should show access denied for provider users', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'provider@test.com',
          name: 'Provider',
          phone_number: '1234567890',
          user_type: 'provider',
        },
        'token123'
      )

      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      expect(screen.getByText('Access Denied')).toBeTruthy()
    })
  })

  describe('Admin Access', () => {
    it('should allow super admin users to access admin dashboard', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'super_admin',
          admin_permissions: ['view_users', 'edit_users'],
        },
        'token123'
      )

      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      expect(screen.getByText('Admin Sidebar')).toBeTruthy()
      expect(screen.getByText('Admin Header')).toBeTruthy()
      expect(screen.getByText('Dashboard Content')).toBeTruthy()
      expect(screen.queryByText('Access Denied')).toBeNull()
    })

    it('should allow manager admin users to access admin dashboard', () => {
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
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      expect(screen.getByText('Admin Sidebar')).toBeTruthy()
      expect(screen.getByText('Admin Header')).toBeTruthy()
      expect(screen.getByText('Dashboard Content')).toBeTruthy()
    })

    it('should allow analyst admin users to access admin dashboard', () => {
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
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      expect(screen.getByText('Admin Sidebar')).toBeTruthy()
      expect(screen.getByText('Dashboard Content')).toBeTruthy()
    })

    it('should allow support admin users to access admin dashboard', () => {
      const { setAuth } = useAuthStore.getState()
      setAuth(
        {
          id: '1',
          email: 'support@test.com',
          name: 'Support',
          phone_number: '1234567890',
          user_type: 'admin',
          admin_role: 'support',
          admin_permissions: ['resolve_disputes', 'view_orders'],
        },
        'token123'
      )

      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      expect(screen.getByText('Admin Sidebar')).toBeTruthy()
      expect(screen.getByText('Dashboard Content')).toBeTruthy()
    })
  })

  describe('Layout Structure', () => {
    it('should render sidebar and header when user is admin', () => {
      const { setAuth } = useAuthStore.getState()
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

      const { container } = render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      const mainContent = container.querySelector('main')
      expect(mainContent).toBeTruthy()
      expect(screen.getByText('Admin Sidebar')).toBeTruthy()
      expect(screen.getByText('Admin Header')).toBeTruthy()
    })

    it('should render sign in button in access denied state', () => {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()

      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      )

      const signInButton = screen.getByRole('button', { name: /go to sign in/i })
      expect(signInButton).toBeTruthy()
      expect(signInButton.className).toMatch(/bg-brand-600/)
    })
  })
})
