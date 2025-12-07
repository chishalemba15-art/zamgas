'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Flame, Package, Truck, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect authenticated users to their dashboard
      if (user.user_type === 'customer') {
        router.push('/customer/dashboard')
      } else if (user.user_type === 'provider') {
        router.push('/provider/dashboard')
      }
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-brand-600 rounded-full p-4">
                <Flame className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
              LPG Delivery
              <span className="block text-brand-600 mt-2">Made Easy</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Order gas cylinders delivered to your doorstep in minutes. Fast, reliable, and
              affordable LPG delivery service across Zambia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="primary"
                onClick={() => router.push('/auth/signup')}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Why Choose ZamGas?
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            We make getting your LPG cylinders simple, safe, and convenient
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 shadow-soft text-center">
            <div className="bg-brand-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Truck className="h-8 w-8 text-brand-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Fast Delivery</h3>
            <p className="text-neutral-600">
              Get your gas delivered within hours, not days
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 shadow-soft text-center">
            <div className="bg-success-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Verified Providers</h3>
            <p className="text-neutral-600">
              All our providers are verified and trusted
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 shadow-soft text-center">
            <div className="bg-accent-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Package className="h-8 w-8 text-accent-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Track Orders</h3>
            <p className="text-neutral-600">
              Real-time tracking of your delivery
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-6 shadow-soft text-center">
            <div className="bg-danger-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Flame className="h-8 w-8 text-danger-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Best Prices</h3>
            <p className="text-neutral-600">
              Competitive pricing from multiple providers
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-brand-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-brand-100 mb-8">
            Join thousands of satisfied customers ordering LPG online
          </p>
          <Button
            size="lg"
            variant="accent"
            onClick={() => router.push('/auth/signup')}
          >
            Create Free Account
          </Button>
        </div>
      </div>
    </div>
  )
}
