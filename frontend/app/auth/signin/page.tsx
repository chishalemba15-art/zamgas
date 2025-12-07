'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flame, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authAPI, adminAuthAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function SignIn() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Detect if this is an admin login by checking email pattern
      const isAdminLogin = formData.email.toLowerCase().includes('admin')

      let response

      if (isAdminLogin) {
        // Use admin login endpoint for admin users
        response = await adminAuthAPI.signIn(formData.email, formData.password)
        setAuth(response.admin, response.token)
        toast.success('Welcome back, Admin!')
        router.push('/admin')
      } else {
        // Use regular auth endpoint for customers, providers, couriers
        response = await authAPI.signIn(formData.email, formData.password)
        setAuth(response.user, response.token)
        toast.success('Welcome back!')

        // Redirect based on user type
        if (response.user.user_type === 'customer') {
          router.push('/customer/dashboard')
        } else if (response.user.user_type === 'provider') {
          router.push('/provider/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-brand-600 rounded-full p-3 mb-4">
            <Flame className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Welcome Back</h1>
          <p className="text-neutral-600 mt-2">Sign in to your ZamGas account</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-medium p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-brand-600 font-medium hover:text-brand-700">
                Sign up
              </Link>
            </p>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link 
                href="/courier/login" 
                className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 transition-colors"
                title="Access Courier Portal"
              >
                <div className="bg-neutral-100 p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                </div>
                <span>Courier Access</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
