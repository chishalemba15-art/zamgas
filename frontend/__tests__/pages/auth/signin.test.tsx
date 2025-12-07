import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignIn from '@/app/auth/signin/page'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/lib/api'

// Mock the API
vi.mock('@/lib/api', () => ({
  authAPI: {
    signIn: vi.fn(),
  },
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('SignIn Page - Admin Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clearAuth()
  })

  describe('Form Rendering', () => {
    it('should render the sign in form', () => {
      render(<SignIn />)
      expect(screen.getByText('Welcome Back')).toBeTruthy()
      expect(screen.getByLabelText('Email')).toBeTruthy()
      expect(screen.getByLabelText('Password')).toBeTruthy()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
    })

    it('should have correct input types', () => {
      render(<SignIn />)
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement

      expect(emailInput.type).toBe('email')
      expect(passwordInput.type).toBe('password')
    })
  })

  describe('Form Validation', () => {
    it('should show email required error when empty', async () => {
      const user = userEvent.setup()
      render(<SignIn />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeTruthy()
      })
    })

    it('should show email invalid error for invalid email', async () => {
      const user = userEvent.setup()
      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'invalidemail')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Email is invalid')).toBeTruthy()
      })
    })

    it('should show password required error when empty', async () => {
      const user = userEvent.setup()
      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'admin@test.com')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeTruthy()
      })
    })
  })

  describe('Admin Login Flow', () => {
    it('should successfully sign in an admin user', async () => {
      const user = userEvent.setup()
      const mockAdminUser = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        phone_number: '1234567890',
        user_type: 'admin' as const,
        admin_role: 'super_admin' as const,
        admin_permissions: ['view_users', 'edit_users', 'delete_users'],
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValueOnce({
        user: mockAdminUser,
        token: 'admin-token-123',
      })

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        const authState = useAuthStore.getState()
        expect(authState.user?.admin_role).toBe('super_admin')
        expect(authState.token).toBe('admin-token-123')
        expect(authState.isAuthenticated).toBe(true)
      })
    })

    it('should redirect to /admin for super_admin users', async () => {
      const user = userEvent.setup()
      const mockAdminUser = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        phone_number: '1234567890',
        user_type: 'admin' as const,
        admin_role: 'super_admin' as const,
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValueOnce({
        user: mockAdminUser,
        token: 'admin-token-123',
      })

      const mockRouter = {
        push: vi.fn(),
      }
      vi.mock('next/navigation', () => ({
        useRouter: () => mockRouter,
      }))

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.authAPI.signIn).toHaveBeenCalledWith('admin@test.com', 'password123')
      })
    })

    it('should redirect to /customer/dashboard for customer users', async () => {
      const user = userEvent.setup()
      const mockCustomerUser = {
        id: '1',
        email: 'customer@test.com',
        name: 'Customer User',
        phone_number: '1234567890',
        user_type: 'customer' as const,
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValueOnce({
        user: mockCustomerUser,
        token: 'customer-token-123',
      })

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'customer@test.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.authAPI.signIn).toHaveBeenCalledWith('customer@test.com', 'password123')
      })
    })

    it('should store admin permissions from login response', async () => {
      const user = userEvent.setup()
      const mockAdminUser = {
        id: '1',
        email: 'manager@test.com',
        name: 'Manager User',
        phone_number: '1234567890',
        user_type: 'admin' as const,
        admin_role: 'manager' as const,
        admin_permissions: ['view_users', 'view_orders', 'view_analytics'],
      }

      vi.mocked(api.authAPI.signIn).mockResolvedValueOnce({
        user: mockAdminUser,
        token: 'manager-token-123',
      })

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'manager@test.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        const authState = useAuthStore.getState()
        expect(authState.user?.admin_permissions).toEqual([
          'view_users',
          'view_orders',
          'view_analytics',
        ])
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message on failed login', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Invalid email or password'

      vi.mocked(api.authAPI.signIn).mockRejectedValueOnce({
        response: {
          data: {
            error: errorMessage,
          },
        },
      })

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.authAPI.signIn).toHaveBeenCalled()
      })
    })

    it('should show generic error when no error message is provided', async () => {
      const user = userEvent.setup()

      vi.mocked(api.authAPI.signIn).mockRejectedValueOnce(new Error('Network error'))

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.authAPI.signIn).toHaveBeenCalled()
      })
    })
  })

  describe('Button States', () => {
    it('should disable form inputs while loading', async () => {
      const user = userEvent.setup()

      vi.mocked(api.authAPI.signIn).mockImplementationOnce(() => new Promise(() => {}))

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true)
        expect(emailInput.disabled).toBe(true)
        expect(passwordInput.disabled).toBe(true)
      })
    })
  })
})
