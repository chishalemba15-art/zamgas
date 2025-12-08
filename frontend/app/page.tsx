'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { 
  Zap, Truck, Shield, Clock, MapPin, Phone, 
  CheckCircle, XCircle, ArrowRight, Star, Users,
  Flame, AlertTriangle, TrendingUp
} from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.user_type === 'customer') {
        router.push('/customer/dashboard')
      } else if (user.user_type === 'provider') {
        router.push('/provider/dashboard')
      }
    }
  }, [isAuthenticated, user, router])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const painPoints = [
    { icon: Clock, problem: "Hours wasted in queues", description: "Standing in long lines at gas depots under the scorching Lusaka sun" },
    { icon: AlertTriangle, problem: "Unreliable supply", description: "Never knowing when your supplier will have stock available" },
    { icon: Truck, problem: "Transportation hassles", description: "Finding transport to carry heavy cylinders back home safely" },
    { icon: XCircle, problem: "Safety concerns", description: "Handling gas cylinders without proper equipment or training" },
  ]

  const solutions = [
    { icon: Zap, title: "Order in 60 Seconds", description: "Select your cylinder size, confirm your address, and you're done. It's that simple.", stat: "60s" },
    { icon: Truck, title: "Same-Day Delivery", description: "Our verified couriers deliver to your doorstep across Lusaka within hours.", stat: "2-3hrs" },
    { icon: Shield, title: "Safe & Certified", description: "All providers are ZEMA-certified. Every cylinder is safety-checked before delivery.", stat: "100%" },
    { icon: MapPin, title: "Live Tracking", description: "Watch your delivery in real-time. Know exactly when your gas will arrive.", stat: "GPS" },
  ]

  const testimonials = [
    { name: "Emily Musonda", location: "Kabulonga, Lusaka", text: "ZAMGAS changed everything! No more weekend trips to Great North Road. My gas arrives while I'm cooking breakfast.", rating: 5 },
    { name: "Joseph Banda", location: "Chilenje, Lusaka", text: "As a busy professional, I can't afford to waste time. ZAMGAS delivers before I get home from work. Exceptional service!", rating: 5 },
    { name: "Grace Phiri", location: "Roma, Lusaka", text: "I used to worry about running out of gas. Now I just tap my phone and it's delivered. The future is here!", rating: 5 },
  ]

  const stats = [
    { value: "10,000+", label: "Happy Customers" },
    { value: "50,000+", label: "Deliveries Made" },
    { value: "4.9/5", label: "Customer Rating" },
    { value: "< 3hrs", label: "Average Delivery" },
  ]

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${zamgasTheme.colors.premium.burgundyDark} 0%, ${zamgasTheme.colors.premium.burgundy} 100%)`,
      }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style={{ background: `${zamgasTheme.colors.premium.burgundy}95` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/app-icon.png" alt="ZAMGAS" width={40} height={40} className="rounded-lg" />
              <span className="text-xl font-bold" style={{ color: zamgasTheme.colors.premium.gold, fontFamily: zamgasTheme.typography.fontFamily.display }}>
                ZAMGAS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ color: zamgasTheme.colors.premium.gray }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                  color: 'white',
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20 L35 30 L30 40 L25 30 Z' fill='%23FBC609'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: `${zamgasTheme.colors.premium.gold}20`, border: `1px solid ${zamgasTheme.colors.premium.gold}30` }}
            >
              <MapPin className="h-4 w-4" style={{ color: zamgasTheme.colors.premium.gold }} />
              <span className="text-sm font-medium" style={{ color: zamgasTheme.colors.premium.gold }}>
                Serving All of Lusaka
              </span>
            </div>

            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
              style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
            >
              <span style={{ color: '#FFFFFF' }}>Never Queue for</span>{' '}
              <span style={{ color: zamgasTheme.colors.premium.gold }}>LPG Again</span>
            </h1>
            
            <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto" style={{ color: zamgasTheme.colors.premium.gray }}>
              Lusaka's first on-demand LPG delivery service. Order your cooking gas in 60 seconds 
              and have it delivered to your doorstep within hours. Safe, fast, and affordable.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-8 py-4 rounded-xl text-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                  color: 'white',
                  boxShadow: `0 8px 32px ${zamgasTheme.colors.premium.red}50`,
                }}
              >
                <Zap className="h-5 w-5" />
                Order Gas Now
              </button>
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-8 py-4 rounded-xl text-lg font-medium transition-all active:scale-95"
                style={{
                  background: zamgasTheme.colors.premium.burgundyLight,
                  border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                  color: zamgasTheme.colors.premium.gold,
                }}
              >
                I Have an Account
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-xl"
                  style={{ background: zamgasTheme.colors.premium.burgundyLight }}
                >
                  <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: zamgasTheme.colors.premium.gold, fontFamily: zamgasTheme.typography.fontFamily.display }}>
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 sm:py-24" style={{ background: zamgasTheme.colors.premium.burgundyDark }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: zamgasTheme.typography.fontFamily.display }}>
              The Old Way of Buying Gas is <span style={{ color: zamgasTheme.colors.semantic.danger }}>Broken</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: zamgasTheme.colors.premium.gray }}>
              For too long, Lusaka residents have struggled with an outdated system
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((point, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl text-center"
                style={{ 
                  background: zamgasTheme.colors.premium.burgundy,
                  border: `1px solid ${zamgasTheme.colors.semantic.danger}30`,
                }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${zamgasTheme.colors.semantic.danger}20` }}
                >
                  <point.icon className="h-7 w-7" style={{ color: zamgasTheme.colors.semantic.danger }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#FFFFFF' }}>{point.problem}</h3>
                <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: zamgasTheme.typography.fontFamily.display }}>
              A <span style={{ color: zamgasTheme.colors.premium.gold }}>Smarter Way</span> to Get Your Gas
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: zamgasTheme.colors.premium.gray }}>
              ZAMGAS brings modern convenience to LPG delivery in Lusaka
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((solution, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl"
                style={{ 
                  background: zamgasTheme.colors.premium.burgundy,
                  border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${zamgasTheme.colors.premium.gold}20` }}
                  >
                    <solution.icon className="h-6 w-6" style={{ color: zamgasTheme.colors.premium.gold }} />
                  </div>
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: zamgasTheme.colors.premium.gold, fontFamily: zamgasTheme.typography.fontFamily.display }}
                  >
                    {solution.stat}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#FFFFFF' }}>{solution.title}</h3>
                <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24" style={{ background: zamgasTheme.colors.premium.burgundyDark }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: zamgasTheme.typography.fontFamily.display }}>
              Order in <span style={{ color: zamgasTheme.colors.premium.gold }}>3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Choose Your Cylinder", desc: "Select from 6kg, 9kg, 15kg, 22.5kg, or 48kg cylinders", icon: Flame },
              { step: "2", title: "Confirm Delivery Address", desc: "Set your location or enter your address in Lusaka", icon: MapPin },
              { step: "3", title: "Pay & Track", desc: "Pay via Mobile Money or Cash on Delivery. Track in real-time.", icon: Truck },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                    boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}40`,
                  }}
                >
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <span 
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: zamgasTheme.colors.premium.gold, color: zamgasTheme.colors.premium.burgundy }}
                >
                  Step {item.step}
                </span>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#FFFFFF' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: zamgasTheme.typography.fontFamily.display }}>
              Trusted by <span style={{ color: zamgasTheme.colors.premium.gold }}>Lusaka Families</span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <div 
              className="p-8 rounded-2xl text-center"
              style={{ 
                background: zamgasTheme.colors.premium.burgundy,
                border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
              }}
            >
              <div className="flex justify-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-5 w-5 fill-current" style={{ color: zamgasTheme.colors.premium.gold }} />
                ))}
              </div>
              <p className="text-lg mb-6 italic" style={{ color: '#FFFFFF' }}>
                "{testimonials[currentTestimonial].text}"
              </p>
              <p className="font-bold" style={{ color: zamgasTheme.colors.premium.gold }}>
                {testimonials[currentTestimonial].name}
              </p>
              <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                {testimonials[currentTestimonial].location}
              </p>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ 
                      background: i === currentTestimonial ? zamgasTheme.colors.premium.gold : `${zamgasTheme.colors.premium.gray}50`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section 
        className="py-16 sm:py-24"
        style={{ 
          background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
            Ready to Experience the Future of LPG Delivery?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of Lusaka residents who never queue for gas anymore
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-10 py-4 rounded-xl text-lg font-bold transition-all active:scale-95 inline-flex items-center gap-2"
            style={{
              background: 'white',
              color: zamgasTheme.colors.premium.red,
            }}
          >
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-white/70 text-sm mt-4">
            No credit card required • Free to use • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ background: zamgasTheme.colors.premium.burgundyDark }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/app-icon.png" alt="ZAMGAS" width={40} height={40} className="rounded-lg" />
              <span className="text-xl font-bold" style={{ color: zamgasTheme.colors.premium.gold }}>ZAMGAS</span>
            </div>
            <div className="flex items-center gap-6 text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
              <a href="tel:+260979000000" className="flex items-center gap-2 hover:opacity-80">
                <Phone className="h-4 w-4" />
                <span>+260 97 900 0000</span>
              </a>
              <span>•</span>
              <span>Lusaka, Zambia</span>
            </div>
            <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
              © 2024 ZAMGAS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
