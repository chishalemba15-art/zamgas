'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, Lock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { zamgasTheme } from '@/lib/zamgas-theme'
import toast from 'react-hot-toast'

export default function CourierSignIn() {
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
      const response = await authAPI.signIn(formData.email, formData.password)
      
      // Verify user is actually a courier
      if (response.user.user_type !== 'courier') {
        toast.error('This portal is restricted to authorized couriers only.')
        setIsLoading(false)
        return
      }

      setAuth(response.user, response.token)
      toast.success('Welcome back, Courier!')
      router.push('/courier/dashboard')

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{
      background: `linear-gradient(135deg, ${zamgasTheme.colors.neutral[50]} 0%, ${zamgasTheme.colors.primary.forest}10 100%)`
    }}>
      <div className="absolute top-6 left-6">
        <Link href="/auth/signin" className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Main Login
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center rounded-2xl p-4 mb-4 shadow-lg transform transition-transform hover:scale-105"
            style={{ 
              background: zamgasTheme.gradients.primary,
              boxShadow: zamgasTheme.shadows.ecoGlow 
            }}
          >
            <Truck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ 
            color: zamgasTheme.colors.semantic.textPrimary,
            fontFamily: zamgasTheme.typography.fontFamily.display 
          }}>
            Courier Portal
          </h1>
          <p style={{ 
            color: zamgasTheme.colors.semantic.textSecondary,
            fontFamily: zamgasTheme.typography.fontFamily.body 
          }}>
            Manage deliveries and earn efficiently
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100" style={{ boxShadow: zamgasTheme.shadows.large }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Courier Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="courier@zamgas.com"
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
              size="lg"
              className="w-full rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              style={{
                background: zamgasTheme.gradients.primary
              }}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Enter Dashboard
            </Button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Protected area for authorized personnel only.</p>
        </div>
      </div>
    </div>
  )
}
