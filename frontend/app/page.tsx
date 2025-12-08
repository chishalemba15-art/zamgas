'use client'

import { useEffect, useState, useRef } from 'react'
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

// Custom hook for scroll-triggered animations
function useScrollAnimation() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => {
              const newSet = new Set(Array.from(prev))
              newSet.add(entry.target.id)
              return newSet
            })
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return visibleSections
}

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const visibleSections = useScrollAnimation()

  // Loading screen effect - fast and reliable
  useEffect(() => {
    // Fallback: Always hide loading after 1.5 seconds max
    const fallback = setTimeout(() => setIsLoading(false), 1500)
    
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setIsLoading(false)
          return 100
        }
        return prev + 25 // Faster progress
      })
    }, 100) // Faster interval
    
    return () => {
      clearInterval(timer)
      clearTimeout(fallback)
    }
  }, [])

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

  // Animation helper - content is always visible, animation is enhancement only
  const getAnimationClass = (sectionId: string, delay: number = 0) => {
    const isVisible = visibleSections.has(sectionId)
    // Always visible, but with subtle transform when first appearing
    return {
      opacity: 1,
      transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
      transition: `transform 0.5s ease-out ${delay}ms`,
    }
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center z-50"
        style={{
          background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundyDark} 0%, ${zamgasTheme.colors.premium.burgundy} 100%)`,
        }}
      >
        {/* Animated Flame */}
        <div className="relative mb-8">
          <div 
            className="animate-pulse"
            style={{
              filter: `drop-shadow(0 0 40px ${zamgasTheme.colors.premium.gold}80)`,
            }}
          >
            <Image 
              src="/app-icon.png" 
              alt="ZAMGAS" 
              width={120} 
              height={120}
              priority
              className="rounded-2xl animate-bounce"
              style={{ animationDuration: '2s' }}
            />
          </div>
          
          {/* Floating particles - fixed positions */}
          <div className="absolute -inset-8">
            {[
              { top: '20%', left: '30%' },
              { top: '35%', left: '70%' },
              { top: '50%', left: '25%' },
              { top: '65%', left: '65%' },
              { top: '40%', left: '45%' },
              { top: '75%', left: '35%' },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-ping"
                style={{
                  background: zamgasTheme.colors.premium.gold,
                  top: pos.top,
                  left: pos.left,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1.5s',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>

        <h1 
          className="text-3xl font-bold mb-4 animate-pulse"
          style={{ 
            color: zamgasTheme.colors.premium.gold,
            fontFamily: zamgasTheme.typography.fontFamily.display,
          }}
        >
          ZAMGAS
        </h1>
        
        <p className="mb-6" style={{ color: zamgasTheme.colors.premium.gray }}>
          Preparing your experience...
        </p>

        {/* Progress bar */}
        <div 
          className="w-48 h-1.5 rounded-full overflow-hidden"
          style={{ background: zamgasTheme.colors.premium.burgundyLight }}
        >
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${loadingProgress}%`,
              background: `linear-gradient(90deg, ${zamgasTheme.colors.premium.gold} 0%, ${zamgasTheme.colors.premium.red} 100%)`,
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen overflow-x-hidden"
      style={{
        background: `linear-gradient(180deg, ${zamgasTheme.colors.premium.burgundyDark} 0%, ${zamgasTheme.colors.premium.burgundy} 100%)`,
      }}
    >
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(251,198,9,0.3) 50%, transparent 100%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scroll { animation: scroll 20s linear infinite; }
        .animate-scroll:hover { animation-play-state: paused; }
        .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
      `}</style>

      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300"
        style={{ background: `${zamgasTheme.colors.premium.burgundy}95` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group cursor-pointer">
              <Image 
                src="/app-icon.png" 
                alt="ZAMGAS" 
                width={40} 
                height={40} 
                className="rounded-lg transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-xl font-bold transition-colors duration-300" style={{ color: zamgasTheme.colors.premium.gold, fontFamily: zamgasTheme.typography.fontFamily.display }}>
                ZAMGAS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/10"
                style={{ color: zamgasTheme.colors.premium.gray }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95"
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
      <section id="hero" data-animate className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20 L35 30 L30 40 L25 30 Z' fill='%23FBC609'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
        
        {/* Floating orbs for parallax effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-64 h-64 rounded-full blur-3xl animate-float"
            style={{ 
              background: `${zamgasTheme.colors.premium.gold}10`,
              top: '10%',
              right: '10%',
              animationDelay: '0s',
            }}
          />
          <div 
            className="absolute w-48 h-48 rounded-full blur-3xl animate-float"
            style={{ 
              background: `${zamgasTheme.colors.premium.red}15`,
              bottom: '20%',
              left: '5%',
              animationDelay: '1.5s',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge with shimmer */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in-up"
              style={{ 
                background: `${zamgasTheme.colors.premium.gold}20`, 
                border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                animationDelay: '0.1s',
              }}
            >
              <MapPin className="h-4 w-4 animate-pulse" style={{ color: zamgasTheme.colors.premium.gold }} />
              <span className="text-sm font-medium" style={{ color: zamgasTheme.colors.premium.gold }}>
                Serving All of Lusaka
              </span>
            </div>

            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up"
              style={{ fontFamily: zamgasTheme.typography.fontFamily.display, animationDelay: '0.2s' }}
            >
              <span style={{ color: '#FFFFFF' }}>Never Queue for</span>{' '}
              <span 
                className="relative"
                style={{ color: zamgasTheme.colors.premium.gold }}
              >
                LPG Again
                <span className="absolute inset-0 animate-shimmer rounded-lg" />
              </span>
            </h1>
            
            <p 
              className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up" 
              style={{ color: zamgasTheme.colors.premium.gray, animationDelay: '0.3s' }}
            >
              Lusaka's first on-demand LPG delivery service. Order your cooking gas in 60 seconds 
              and have it delivered to your doorstep within hours. Safe, fast, and affordable.
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                style={{
                  background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                  color: 'white',
                  boxShadow: `0 8px 32px ${zamgasTheme.colors.premium.red}50`,
                }}
              >
                <Zap className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                Order Gas Now
              </button>
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95"
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
            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              {stats.map((stat, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-xl hover-lift cursor-pointer"
                  style={{ 
                    background: zamgasTheme.colors.premium.burgundyLight,
                    transitionDelay: `${i * 100}ms`,
                  }}
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

      {/* Trusted Brands Section */}
      <section id="brands" className="py-12 sm:py-16 overflow-hidden" style={{ background: zamgasTheme.colors.premium.burgundyDark }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: zamgasTheme.colors.premium.gold }}>
              🏆 Delivering Your Favorite Brands
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#FFFFFF', fontFamily: zamgasTheme.typography.fontFamily.display }}>
              Trusted <span style={{ color: zamgasTheme.colors.premium.gold }}>LPG Brands</span> Available
            </h2>
            <p className="text-sm mt-2" style={{ color: zamgasTheme.colors.premium.gray }}>
              We deliver from Zambia's most trusted gas suppliers
            </p>
          </div>

          {/* Scrolling Logo Carousel */}
          <div className="relative">
            {/* Gradient fade on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10" style={{ background: `linear-gradient(to right, ${zamgasTheme.colors.premium.burgundyDark}, transparent)` }} />
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10" style={{ background: `linear-gradient(to left, ${zamgasTheme.colors.premium.burgundyDark}, transparent)` }} />
            
            {/* Scrolling container */}
            <div className="flex gap-8 animate-scroll">
              {/* First set of logos */}
              {[
                { name: 'Rubis', logo: '/rubis.webp' },
                { name: 'Oryx', logo: '/oryx.png' },
                { name: 'TotalEnergy', logo: '/totalenergy.png' },
                { name: 'Puma Energy', logo: '/pumaenergy.png' },
                { name: 'Merugas', logo: '/merugas.png' },
                { name: 'Cadac', logo: '/cadac.png' },
              ].map((brand, i) => (
                <div
                  key={`brand-1-${i}`}
                  className="flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                  style={{ 
                    background: zamgasTheme.colors.premium.burgundy,
                    border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
                    minWidth: '140px',
                  }}
                >
                  <div 
                    className="w-20 h-20 rounded-lg flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: '#FFFFFF' }}
                  >
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={64}
                      height={64}
                      className="object-contain max-h-16"
                    />
                  </div>
                  <span className="text-sm font-medium text-center" style={{ color: zamgasTheme.colors.premium.gray }}>
                    {brand.name}
                  </span>
                </div>
              ))}
              {/* Duplicate set for infinite scroll effect */}
              {[
                { name: 'Rubis', logo: '/rubis.webp' },
                { name: 'Oryx', logo: '/oryx.png' },
                { name: 'TotalEnergy', logo: '/totalenergy.png' },
                { name: 'Puma Energy', logo: '/pumaenergy.png' },
                { name: 'Merugas', logo: '/merugas.png' },
                { name: 'Cadac', logo: '/cadac.png' },
              ].map((brand, i) => (
                <div
                  key={`brand-2-${i}`}
                  className="flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                  style={{ 
                    background: zamgasTheme.colors.premium.burgundy,
                    border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
                    minWidth: '140px',
                  }}
                >
                  <div 
                    className="w-20 h-20 rounded-lg flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: '#FFFFFF' }}
                  >
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={64}
                      height={64}
                      className="object-contain max-h-16"
                    />
                  </div>
                  <span className="text-sm font-medium text-center" style={{ color: zamgasTheme.colors.premium.gray }}>
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[
              { icon: Shield, text: 'ZEMA Certified' },
              { icon: CheckCircle, text: 'Quality Guaranteed' },
              { icon: Truck, text: 'Safe Delivery' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" style={{ color: zamgasTheme.colors.premium.gold }} />
                <span className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section 
        id="pain-points" 
        data-animate 
        className="py-16 sm:py-24" 
        style={{ background: zamgasTheme.colors.premium.burgundyDark }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" style={getAnimationClass('pain-points')}>
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
                className="p-6 rounded-2xl text-center hover-lift cursor-pointer group"
                style={{ 
                  background: zamgasTheme.colors.premium.burgundy,
                  border: `1px solid ${zamgasTheme.colors.semantic.danger}30`,
                  ...getAnimationClass('pain-points', i * 100),
                }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
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
      <section id="solutions" data-animate className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" style={getAnimationClass('solutions')}>
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
                className="p-6 rounded-2xl hover-lift cursor-pointer group"
                style={{ 
                  background: zamgasTheme.colors.premium.burgundy,
                  border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                  ...getAnimationClass('solutions', i * 100),
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6"
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
      <section id="how-it-works" data-animate className="py-16 sm:py-24" style={{ background: zamgasTheme.colors.premium.burgundyDark }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" style={getAnimationClass('how-it-works')}>
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
              <div 
                key={i} 
                className="text-center relative group"
                style={getAnimationClass('how-it-works', i * 150)}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
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
      <section id="testimonials" data-animate className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" style={getAnimationClass('testimonials')}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: zamgasTheme.typography.fontFamily.display }}>
              Trusted by <span style={{ color: zamgasTheme.colors.premium.gold }}>Lusaka Families</span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto" style={getAnimationClass('testimonials', 100)}>
            <div 
              className="p-8 rounded-2xl text-center transition-all duration-500"
              style={{ 
                background: zamgasTheme.colors.premium.burgundy,
                border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
              }}
            >
              <div className="flex justify-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star 
                    key={i} 
                    className="h-5 w-5 fill-current transition-transform duration-300" 
                    style={{ 
                      color: zamgasTheme.colors.premium.gold,
                      transitionDelay: `${i * 50}ms`,
                    }} 
                  />
                ))}
              </div>
              <p 
                className="text-lg mb-6 italic transition-opacity duration-500" 
                style={{ color: '#FFFFFF' }}
                key={currentTestimonial}
              >
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
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      background: i === currentTestimonial ? zamgasTheme.colors.premium.gold : `${zamgasTheme.colors.premium.gray}50`,
                      transform: i === currentTestimonial ? 'scale(1.5)' : 'scale(1)',
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
        id="cta" 
        data-animate
        className="py-16 sm:py-24 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: 'white', top: '-10%', right: '-10%' }} />
          <div className="absolute w-64 h-64 rounded-full blur-3xl animate-float" style={{ background: 'white', bottom: '-10%', left: '10%', animationDelay: '1s' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10" style={getAnimationClass('cta')}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
            Ready to Experience the Future of LPG Delivery?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of Lusaka residents who never queue for gas anymore
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-10 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-2 group"
            style={{
              background: 'white',
              color: zamgasTheme.colors.premium.red,
            }}
          >
            Create Free Account
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
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
            <div className="flex items-center gap-3 group cursor-pointer">
              <Image 
                src="/app-icon.png" 
                alt="ZAMGAS" 
                width={40} 
                height={40} 
                className="rounded-lg transition-transform duration-300 group-hover:rotate-12"
              />
              <span className="text-xl font-bold" style={{ color: zamgasTheme.colors.premium.gold }}>ZAMGAS</span>
            </div>
            <div className="flex items-center gap-6 text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
              <a href="tel:+260979000000" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Phone className="h-4 w-4" />
                <span>+260 97 900 0000</span>
              </a>
              <span>•</span>
              <span>Lusaka, Zambia</span>
            </div>
            <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
              © 2026 ZAMGAS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
