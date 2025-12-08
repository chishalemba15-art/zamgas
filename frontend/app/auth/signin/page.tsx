'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, Zap, Truck } from 'lucide-react'
import { authAPI, adminAuthAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { zamgasTheme } from '@/lib/zamgas-theme'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zamgas.com'

function SignInContent() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      const isAdminLogin = formData.email.toLowerCase().includes('admin')

      let response

      if (isAdminLogin) {
        response = await adminAuthAPI.signIn(formData.email, formData.password)
        setAuth(response.admin, response.token)
        toast.success('Welcome back, Admin!')
        router.push('/admin')
      } else {
        response = await authAPI.signIn(formData.email, formData.password)
        setAuth(response.user, response.token)
        toast.success('Welcome back!')

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

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    window.location.href = `${API_URL}/auth/google`
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
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
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center rounded-2xl p-1 mb-4 overflow-hidden"
            style={{ 
              boxShadow: `0 8px 32px ${zamgasTheme.colors.premium.gold}30`,
            }}
          >
            <Image 
              src="/app-icon.png" 
              alt="ZAMGAS" 
              width={80} 
              height={80}
              className="object-cover rounded-xl"
            />
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: zamgasTheme.colors.premium.gold,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: zamgasTheme.colors.premium.gray }}>
            Sign in to your ZAMGAS account
          </p>
        </div>

        {/* Sign In Card */}
        <div 
          className="rounded-3xl p-8 backdrop-blur-lg"
          style={{
            background: `${zamgasTheme.colors.premium.burgundy}90`,
            border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            style={{
              background: '#FFFFFF',
              color: '#333333',
            }}
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{isGoogleLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: `${zamgasTheme.colors.premium.gray}30` }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span 
                className="px-4"
                style={{ 
                  background: zamgasTheme.colors.premium.burgundy,
                  color: zamgasTheme.colors.premium.gray,
                }}
              >
                or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: zamgasTheme.colors.premium.gray }}
              >
                Email
              </label>
              <div className="relative">
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: zamgasTheme.colors.premium.gold }}
                >
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: errors.email 
                      ? `2px solid ${zamgasTheme.colors.semantic.danger}` 
                      : `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.danger }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: zamgasTheme.colors.premium.gray }}
              >
                Password
              </label>
              <div className="relative">
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: zamgasTheme.colors.premium.gold }}
                >
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: errors.password 
                      ? `2px solid ${zamgasTheme.colors.semantic.danger}` 
                      : `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.danger }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p style={{ color: zamgasTheme.colors.premium.gray }}>
              Don't have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="font-semibold transition-colors"
                style={{ color: zamgasTheme.colors.premium.gold }}
              >
                Sign up
              </Link>
            </p>
            
            {/* Courier Access */}
            <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${zamgasTheme.colors.premium.gray}20` }}>
              <Link 
                href="/courier/login" 
                className="inline-flex items-center gap-2 text-sm transition-all active:scale-95 px-4 py-2 rounded-xl"
                style={{ 
                  color: zamgasTheme.colors.premium.gray,
                  background: zamgasTheme.colors.premium.burgundyLight,
                }}
              >
                <Truck className="h-4 w-4" />
                <span>Courier Portal</span>
              </Link>
            </div>
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

export default function SignIn() {
  return (
    <Suspense fallback={
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundyDark} 0%, ${zamgasTheme.colors.premium.burgundy} 100%)`,
        }}
      >
        <div 
          className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: zamgasTheme.colors.premium.gold, borderTopColor: 'transparent' }}
        />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
