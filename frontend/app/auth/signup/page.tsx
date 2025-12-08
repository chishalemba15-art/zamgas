'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, User, Phone, Zap, Briefcase } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { zamgasTheme } from '@/lib/zamgas-theme'
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
        expoPushToken: 'web-user',
      })

      toast.success('Account created successfully!')

      const signInResponse = await authAPI.signIn(formData.email, formData.password)
      setAuth(signInResponse.user, signInResponse.token)

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
    <div 
      className="min-h-screen flex items-center justify-center p-4 py-8"
      style={{
        background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundyDark} 0%, ${zamgasTheme.colors.premium.burgundy} 50%, ${zamgasTheme.colors.premium.burgundyDark} 100%)`,
      }}
    >
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20 L35 30 L30 40 L25 30 Z' fill='%23FBC609'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div 
            className="inline-flex items-center justify-center rounded-2xl p-1 mb-4 overflow-hidden"
            style={{ 
              boxShadow: `0 8px 32px ${zamgasTheme.colors.premium.gold}30`,
            }}
          >
            <Image 
              src="/app-icon.png" 
              alt="ZAMGAS" 
              width={72} 
              height={72}
              className="object-cover rounded-xl"
            />
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: zamgasTheme.colors.premium.gold,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Create Account
          </h1>
          <p style={{ color: zamgasTheme.colors.premium.gray }}>
            Join ZAMGAS for fast LPG delivery
          </p>
        </div>

        {/* Sign Up Card */}
        <div 
          className="rounded-3xl p-6 backdrop-blur-lg"
          style={{
            background: `${zamgasTheme.colors.premium.burgundy}90`,
            border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: zamgasTheme.colors.premium.gray }}>
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: zamgasTheme.colors.premium.gold }}>
                  <User className="h-5 w-5" />
                </div>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl transition-all outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: errors.name ? `2px solid ${zamgasTheme.colors.semantic.danger}` : `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              {errors.name && <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.danger }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: zamgasTheme.colors.premium.gray }}>
                Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: zamgasTheme.colors.premium.gold }}>
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl transition-all outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: errors.email ? `2px solid ${zamgasTheme.colors.semantic.danger}` : `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.danger }}>{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: zamgasTheme.colors.premium.gray }}>
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: zamgasTheme.colors.premium.gold }}>
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="0977123456"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl transition-all outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: errors.phone_number ? `2px solid ${zamgasTheme.colors.semantic.danger}` : `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.premium.gray }}>Zambian number starting with 09 or 07</p>
              {errors.phone_number && <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.danger }}>{errors.phone_number}</p>}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: zamgasTheme.colors.premium.gray }}>
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'customer' })}
                  className="p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: formData.user_type === 'customer' ? `${zamgasTheme.colors.premium.red}30` : zamgasTheme.colors.premium.burgundyLight,
                    border: formData.user_type === 'customer' ? `2px solid ${zamgasTheme.colors.premium.gold}` : `1px solid ${zamgasTheme.colors.premium.gray}20`,
                    color: formData.user_type === 'customer' ? zamgasTheme.colors.premium.gold : zamgasTheme.colors.premium.gray,
                  }}
                >
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'provider' })}
                  className="p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: formData.user_type === 'provider' ? `${zamgasTheme.colors.premium.red}30` : zamgasTheme.colors.premium.burgundyLight,
                    border: formData.user_type === 'provider' ? `2px solid ${zamgasTheme.colors.premium.gold}` : `1px solid ${zamgasTheme.colors.premium.gray}20`,
                    color: formData.user_type === 'provider' ? zamgasTheme.colors.premium.gold : zamgasTheme.colors.premium.gray,
                  }}
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm font-medium">Provider</span>
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: zamgasTheme.colors.premium.gray }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: zamgasTheme.colors.premium.gold }}>
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl transition-all outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: errors.password ? `2px solid ${zamgasTheme.colors.semantic.danger}` : `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.premium.gray }}>At least 6 characters</p>
              {errors.password && <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.danger }}>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: zamgasTheme.colors.premium.gray }}>
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: zamgasTheme.colors.premium.gold }}>
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl transition-all outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: errors.confirmPassword ? `2px solid ${zamgasTheme.colors.semantic.danger}` : `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.danger }}>{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
              style={{
                background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}50`,
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p style={{ color: zamgasTheme.colors.premium.gray }}>
              Already have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="font-semibold transition-colors"
                style={{ color: zamgasTheme.colors.premium.gold }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Tagline */}
        <p className="text-center mt-6 text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
          🔥 Fast • Safe • Reliable LPG Delivery
        </p>
      </div>
    </div>
  )
}
