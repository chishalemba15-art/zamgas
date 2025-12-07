'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flame, Mail, Lock, User, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function SignUp() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    user_type: 'customer' as 'customer' | 'provider',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.phone_number) {
      newErrors.phone_number = 'Phone number is required'
    } else if (!/^(?:\+260|0)?[97]\d{8}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Please enter a valid Zambian phone number'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Format phone number for API
      let phoneNumber = formData.phone_number.replace(/\s/g, '')
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+260' + phoneNumber.slice(1)
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+260' + phoneNumber
      }

      const response = await authAPI.signUp({
        name: formData.name,
        email: formData.email,
        phone_number: phoneNumber,
        password: formData.password,
        user_type: formData.user_type,
        expoPushToken: 'web-user', // For web users, will implement push notifications later
      })

      toast.success('Account created successfully!')

      // Auto sign in after signup
      const signInResponse = await authAPI.signIn(formData.email, formData.password)
      setAuth(signInResponse.user, signInResponse.token)

      // Redirect based on user type
      if (formData.user_type === 'customer') {
        router.push('/customer/dashboard')
      } else if (formData.user_type === 'provider') {
        router.push('/provider/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create account. Please try again.')
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
          <h1 className="text-3xl font-bold text-neutral-900">Create Account</h1>
          <p className="text-neutral-600 mt-2">Join ZamGas for fast LPG delivery</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-medium p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="John Doe"
              required
              disabled={isLoading}
            />

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
              label="Phone Number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              error={errors.phone_number}
              placeholder="0977123456"
              helperText="Zambian number starting with 09 or 07"
              required
              disabled={isLoading}
            />

            <Select
              label="Account Type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              options={[
                { value: 'customer', label: 'Customer - Order Gas' },
                { value: 'provider', label: 'Provider - Deliver Gas' },
              ]}
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
              helperText="At least 6 characters"
              required
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
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
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-brand-600 font-medium hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
