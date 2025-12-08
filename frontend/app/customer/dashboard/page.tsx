'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PaymentStatusModal } from '@/components/ui/PaymentStatusModal'
import { Input } from '@/components/ui/Input'
import { LocationPermissionModal } from '@/components/ui/LocationPermissionModal'
import { PremiumSubscriptionModal } from '@/components/ui/PremiumSubscriptionModal'
import { OrderLoadingModal } from '@/components/ui/OrderLoadingModal'
import { OrderSuccessModal } from '@/components/ui/OrderSuccessModal'
import { EcoImpactCard } from '@/components/ui/EcoImpactCard'
import { CarbonSavingsCard } from '@/components/ui/CarbonSavingsCard'
import { CleanEnergyBadge } from '@/components/ui/CleanEnergyBadge'
import { ProviderSearchingAnimation } from '@/components/ui/ProviderSearchingAnimation'
import {
  providerAPI,
  orderAPI,
  preferencesAPI,
  nearestProviderAPI,
  userAPI,
  type Provider,
  type UserPreferences,
  type ProviderWithDistance,
  type Order
} from '@/lib/api'
import { Zap, MapPin, TrendingUp, Star, Navigation, Package, Crown, Map, Shield, CreditCard, Wallet, Smartphone, Leaf, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const CYLINDER_TYPES = [
  { value: '3KG', label: '3 KG' },
  { value: '5KG', label: '5 KG' },
  { value: '6KG', label: '6 KG' },
  { value: '9KG', label: '9 KG' },
  { value: '12KG', label: '12 KG' },
  { value: '13KG', label: '13 KG' },
  { value: '19KG', label: '19 KG' },
  { value: '48KG', label: '48 KG' },
]

// Quick order cylinder sizes
const QUICK_ORDER_SIZES = ['6KG', '9KG', '13KG', '19KG']

export default function CustomerDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [nearestProvider, setNearestProvider] = useState<ProviderWithDistance | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showOrderLoadingModal, setShowOrderLoadingModal] = useState(false)
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false)
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [isSearchingProvider, setIsSearchingProvider] = useState(false)
  const [isImpactCollapsed, setIsImpactCollapsed] = useState(false)
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentDepositId, setCurrentDepositId] = useState('')
  const [orderForm, setOrderForm] = useState({
    cylinder_type: '13KG',
    quantity: 1,
    delivery_address: '',
    delivery_method: 'home_delivery',
    payment_method: 'cash',
  })

  useEffect(() => {
    const savedCylinder = localStorage.getItem('preferredCylinder')
    if (savedCylinder) {
      setOrderForm(prev => ({ ...prev, cylinder_type: savedCylinder }))
    }
    
    // Handle Google OAuth callback - capture token from URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1) // Remove the #
      const params = new URLSearchParams(hash)
      const token = params.get('token')
      const userId = params.get('user_id')
      const userName = params.get('user_name')
      const userEmail = params.get('user_email')
      const userType = params.get('user_type')
      
      if (token && userId) {
        // Store auth data
        localStorage.setItem('authToken', token)
        const userData = {
          id: userId,
          name: decodeURIComponent(userName || ''),
          email: decodeURIComponent(userEmail || ''),
          user_type: (userType || 'customer') as 'customer' | 'provider' | 'courier' | 'admin'
        }
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Update auth store
        const { setAuth } = useAuthStore.getState()
        setAuth(userData, token)
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname)
        
        toast.success(`Welcome, ${userData.name}!`)
      }
    }
  }, [])
  const [isOrdering, setIsOrdering] = useState(false)

  useEffect(() => {
    // Check if we should show location modal
    const hasAskedBefore = localStorage.getItem('locationPermissionAsked')
    if (!hasAskedBefore) {
      setShowLocationModal(true)
    } else {
      initializeDashboard()
    }
  }, [])

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      setUserLocation(location)

      // Update user location in backend
      try {
        await userAPI.updateLocation(location.lat, location.lng)
        toast.success('Location updated successfully!')
      } catch (error) {
        console.error('Failed to update location:', error)
      }

      return location
    } catch (error) {
      console.error('Location permission denied or failed:', error)
      toast.error('Location access denied. We\'ll select a random provider for you.')
      return null
    }
  }

  const handleAllowLocation = async () => {
    localStorage.setItem('locationPermissionAsked', 'true')
    setShowLocationModal(false)

    const location = await requestLocationPermission()
    await initializeDashboard(location)
  }

  const handleDenyLocation = async () => {
    localStorage.setItem('locationPermissionAsked', 'true')
    setShowLocationModal(false)

    toast('We\'ll select a provider for you', { icon: 'ℹ️' })
    await initializeDashboard(null)
  }

  const selectRandomProvider = (providersData: Provider[]) => {
    if (providersData && providersData.length > 0) {
      const randomIndex = Math.floor(Math.random() * providersData.length)
      const randomProvider = providersData[randomIndex]
      setSelectedProvider(randomProvider)
      toast.success(`Selected ${randomProvider.name} as your provider`)
    }
  }

  const initializeDashboard = async (location?: { lat: number; lng: number } | null) => {
    setIsLoading(true)
    setIsSearchingProvider(true)
    
    try {
      // Fetch providers (critical - must succeed)
      console.log('Fetching providers...')
      const providersData = await providerAPI.getAll()
      console.log('Providers loaded:', providersData?.length || 0)
      setProviders(providersData || [])

      // Fetch user orders (non-critical)
      try {
        console.log('Fetching user orders...')
        const ordersData = await orderAPI.getUserOrders()
        console.log('Orders loaded:', ordersData?.length || 0)
        setUserOrders(ordersData || [])
      } catch (error) {
        console.error('Failed to load orders:', error)
        setUserOrders([])
      }

      // Fetch user profile (non-critical)
      let userProfile = null
      try {
        console.log('Fetching user profile...')
        userProfile = await userAPI.getProfile()
        console.log('Profile loaded')
      } catch (error) {
        console.error('Failed to load profile:', error)
      }

      // Fetch preferences (non-critical)
      try {
        console.log('Fetching preferences...')
        const prefsData = await preferencesAPI.get()
        console.log('Preferences loaded')
        setPreferences(prefsData.preferences)

        // Load preferences into form
        if (prefsData.preferences) {
          if (prefsData.preferences.preferred_cylinder_type) {
            setOrderForm(prev => ({ ...prev, cylinder_type: prefsData.preferences!.preferred_cylinder_type! }))
          }
          if (prefsData.preferences.saved_delivery_address) {
            setOrderForm(prev => ({ ...prev, delivery_address: prefsData.preferences!.saved_delivery_address! }))
          }
          // Check for preferred provider
          if (prefsData.preferences.preferred_provider_id && providersData && providersData.length > 0) {
            const preferredProvider = providersData.find(p => p.id === prefsData.preferences!.preferred_provider_id)
            if (preferredProvider) {
              console.log('Using preferred provider:', preferredProvider.name)
              setSelectedProvider(preferredProvider)
              setIsSearchingProvider(false)
              setIsLoading(false)
              return
            }
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
        setPreferences(null)
      }

      // Determine final location
      const finalLocation = location || (userProfile?.latitude && userProfile?.longitude
        ? { lat: userProfile.latitude, lng: userProfile.longitude }
        : null)

      if (finalLocation) {
        setUserLocation(finalLocation)
      }

      // Find nearest provider if location available
      if (finalLocation && providersData && providersData.length > 0) {
        try {
          console.log('Finding nearest provider...')
          const nearestData = await nearestProviderAPI.get(false)
          const nearestProvider = nearestData?.provider
          
          if (nearestProvider && nearestProvider.provider) {
            console.log('Nearest provider found:', nearestProvider.provider.name)
            setNearestProvider(nearestProvider)
            setSelectedProvider(nearestProvider.provider)
            setIsSearchingProvider(false)
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error('Failed to find nearest provider:', error)
        }
      }

      // Fallback: Select random provider
      console.log('Selecting random provider...')
      selectRandomProvider(providersData || [])
      setIsSearchingProvider(false)
    } catch (error) {
      console.error('Dashboard initialization error:', error)
      toast.error('Failed to load dashboard. Please refresh the page.')
      setIsSearchingProvider(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickOrderSelect = async (cylinderType: string) => {
    setOrderForm({ ...orderForm, cylinder_type: cylinderType })
    
    // Save to localStorage
    localStorage.setItem('preferredCylinder', cylinderType)
    
    // Save to API
    try {
      await preferencesAPI.updateCylinderType(cylinderType)
    } catch (error) {
      console.log('Failed to save cylinder preference to server')
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedProvider) {
      toast.error('Please select a provider')
      return
    }
    if (!user) {
      toast.error('Please sign in to place an order')
      return
    }

    if (!orderForm.delivery_address.trim()) {
      toast.error('Please enter delivery address')
      return
    }

    // Validate mobile money phone number
    if (orderForm.payment_method === 'mobile_money') {
      if (!mobileMoneyPhone.trim()) {
        toast.error('Please enter your mobile money phone number')
        return
      }
      if (!/^\+?260\d{9}$/.test(mobileMoneyPhone.replace(/\s/g, ''))) {
        toast.error('Please enter a valid Zambian phone number (+260...)')
        return
      }
    }

    setIsOrdering(true)
    setShowOrderLoadingModal(true)

    try {
      const order: Partial<Order> = {
        user_id: user.id,
        provider_id: selectedProvider.id,
        cylinder_type: orderForm.cylinder_type as any,
        quantity: orderForm.quantity,
        delivery_address: orderForm.delivery_address,
        delivery_method: orderForm.delivery_method,
        payment_method: orderForm.payment_method,
      }

      const orderResponse = await orderAPI.create(order)
      console.log('Order created:', orderResponse) // Debug log

      // If mobile money, initiate payment
      if (orderForm.payment_method === 'mobile_money') {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://zamgas-alb-934347338.us-east-1.elb.amazonaws.com'
          const token = localStorage.getItem('authToken')
          
          console.log('Initiating payment for order ID:', orderResponse.order?.id || orderResponse.id)
          
          // Sandbox Auto-Test Mode: Substitute test numbers for realistic testing
          // In sandbox mode, use PawaPay test numbers to get proper COMPLETED/FAILED responses
          const isSandbox = process.env.NEXT_PUBLIC_ENVIRONMENT === 'sandbox' || 
                            process.env.NEXT_PUBLIC_PAWAPAY_MODE === 'sandbox'
          
          let paymentPhoneNumber = mobileMoneyPhone.replace(/\s/g, '')
          
          if (isSandbox) {
            // Zambia (AIRTEL_OAPI_ZMB) Test Numbers:
            // SUCCESS: 260973456789 → COMPLETED
            // FAIL: 260973456039 → PAYMENT_NOT_APPROVED
            // FAIL: 260973456049 → INSUFFICIENT_BALANCE
            // FAIL: 260973456019 → PAYER_LIMIT_REACHED
            // FAIL: 260973456069 → UNSPECIFIED_FAILURE
            
            const successNumber = '260973456789'
            const failureNumbers = [
              '260973456039', // PAYMENT_NOT_APPROVED
              '260973456049', // INSUFFICIENT_BALANCE
              '260973456019', // PAYER_LIMIT_REACHED
              '260973456069', // UNSPECIFIED_FAILURE
            ]
            
            // 98% success rate, 2% failure for realistic testing
            const randomValue = Math.random()
            if (randomValue < 0.98) {
              paymentPhoneNumber = successNumber
              console.log('🧪 Sandbox: Using SUCCESS test number:', successNumber)
            } else {
              const randomFailure = failureNumbers[Math.floor(Math.random() * failureNumbers.length)]
              paymentPhoneNumber = randomFailure
              console.log('🧪 Sandbox: Using FAILURE test number:', randomFailure)
            }
          }
          
          const paymentResponse = await fetch(`${API_URL}/payments/deposit`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              order_id: orderResponse.order?.id || orderResponse.id,
              amount: orderResponse.order?.grand_total || orderResponse.grand_total,
              phone_number: paymentPhoneNumber,
            }),
          })

          if (!paymentResponse.ok) {
            const errorData = await paymentResponse.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(errorData.error || `HTTP ${paymentResponse.status}`)
          }

          const paymentData = await paymentResponse.json()
          
          if (paymentData.depositId) {
            setCurrentDepositId(paymentData.depositId)
            setShowOrderLoadingModal(false)
            setShowPaymentModal(true)
          } else {
            throw new Error('No deposit ID received from payment service')
          }
        } catch (error: any) {
          console.error('Payment initiation error:', error)
          setShowOrderLoadingModal(false)
          toast.error(error.message || 'Failed to initiate mobile money payment')
          setIsOrdering(false)
          return
        }
      } else {
        // Cash payment - show success immediately
        setShowOrderLoadingModal(false)
        setShowOrderSuccessModal(true)
      }

      // Save preferences
      await preferencesAPI.upsert({
        preferred_cylinder_type: orderForm.cylinder_type,
        preferred_provider_id: selectedProvider.id,
        saved_delivery_address: orderForm.delivery_address,
      }).catch(() => {})

    } catch (error: any) {
      setShowOrderLoadingModal(false)
      toast.error(error.response?.data?.error || 'Failed to place order')
    } finally {
      if (orderForm.payment_method !== 'mobile_money') {
        setIsOrdering(false)
      }
    }
  }

  const handleSubscribePremium = () => {
    setIsPremiumUser(true)
    setShowPremiumModal(false)
    toast.success('Welcome to Premium! 🌟')
  }

  const handleViewOrders = () => {
    setShowOrderSuccessModal(false)
    router.push('/customer/orders')
  }

  const handleCloseSuccessModal = () => {
    setShowOrderSuccessModal(false)
    // Reset form
    setOrderForm({
      cylinder_type: '13KG',
      quantity: 1,
      delivery_address: orderForm.delivery_address, // Keep address
      delivery_method: 'home_delivery',
      payment_method: 'cash',
    })
  }

  return (
    <>
      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => handleDenyLocation()}
        onAllow={handleAllowLocation}
        onDeny={handleDenyLocation}
      />

      {/* Premium Subscription Modal */}
      <PremiumSubscriptionModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={handleSubscribePremium}
      />

      {/* Order Loading Modal */}
      <OrderLoadingModal isOpen={showOrderLoadingModal} />

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={showOrderSuccessModal}
        onClose={handleCloseSuccessModal}
        onViewOrders={handleViewOrders}
      />

      <DashboardLayout title="ZamGas Dashboard">
        {/* Active Order Notification - Minimal & Top */}
        {userOrders.find(o => ['in-transit', 'accepted', 'pending'].includes(o.status)) && (
          (() => {
            const activeOrder = userOrders.find(o => o.status === 'in-transit') || userOrders.find(o => o.status === 'accepted') || userOrders.find(o => o.status === 'pending')
            if (!activeOrder) return null;
            
            const hasCourier = activeOrder.courier_id && activeOrder.courier_name;
            
            return (
              <div 
                className="mx-[-1.5rem] mt-[-1.5rem] mb-6 px-6 py-4 text-white hover:bg-opacity-95 transition-all cursor-pointer shadow-md relative z-20"
                style={{ 
                  background: activeOrder.status === 'in-transit' 
                    ? `linear-gradient(to right, ${zamgasTheme.colors.semantic.info}, #3B82F6)` 
                    : activeOrder.status === 'accepted'
                    ? `linear-gradient(to right, ${zamgasTheme.colors.secondary.amber}, #F59E0B)`
                    : `linear-gradient(to right, ${zamgasTheme.colors.accent.teal}, #14B8A6)`
                }}
                onClick={() => router.push('/customer/orders')}
              >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/20 rounded-full animate-pulse">
                       <Truck className="h-5 w-5 text-white" />
                     </div>
                     <div>
                       <div className="flex items-center gap-2">
                         <p className="font-bold text-sm tracking-wide uppercase">
                           {activeOrder.status === 'in-transit' ? 'Delivery in Progress' : 
                            activeOrder.status === 'accepted' ? 'Order Accepted' : 
                            'Order Processing'}
                         </p>
                         <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">#{activeOrder.id.slice(0,6)}</span>
                       </div>
                       <p className="text-xs text-white/90 font-medium mt-0.5">
                         {activeOrder.status === 'in-transit' 
                           ? `Your gas is on the way! ${activeOrder.current_address ? `Near: ${activeOrder.current_address}` : ''}` 
                           : activeOrder.status === 'accepted'
                           ? 'Courier is preparing your delivery.'
                           : hasCourier 
                           ? `Courier assigned: ${activeOrder.courier_name}`
                           : 'Finding you the best courier...'}
                       </p>
                       {/* Courier Details */}
                       {hasCourier && (
                         <div className="flex items-center gap-3 mt-2">
                           <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg">
                             <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">
                               {activeOrder.courier_name?.charAt(0).toUpperCase()}
                             </div>
                             <span className="text-xs font-medium">{activeOrder.courier_name}</span>
                           </div>
                           {activeOrder.courier_phone && (
                             <a 
                               href={`tel:${activeOrder.courier_phone}`}
                               onClick={(e) => e.stopPropagation()}
                               className="flex items-center gap-1.5 bg-white/30 hover:bg-white/40 px-2 py-1 rounded-lg transition-colors"
                             >
                               <Smartphone className="h-3 w-3" />
                               <span className="text-xs font-medium">{activeOrder.courier_phone}</span>
                             </a>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/30 transition-colors">
                     Track
                     <Navigation className="h-3 w-3" />
                   </div>
                 </div>
              </div>
            )
          })()
        )}

        {/* Hero Section - ZamGas Branded */}
        <div
          className="relative -mx-6 -mt-6 mb-6 p-5 sm:p-8 pb-8 sm:pb-10 rounded-b-3xl overflow-hidden"
          style={{
            background: zamgasTheme.gradients.primary,
            boxShadow: zamgasTheme.shadows.large,
          }}
        >
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20 L35 30 L30 40 L25 30 Z M20 30 L30 25 L40 30 L30 35 Z' fill='white' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }} />

          <div className="relative z-10 text-white">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
                    Clean Cooking Energy
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-white/90" style={{ fontFamily: zamgasTheme.typography.fontFamily.body }}>
                  LPG delivery made simple and sustainable
                </p>
              </div>
              <CleanEnergyBadge variant="inline" />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div
                className="p-3 rounded-xl text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
                  50%
                </p>
                <p className="text-xs opacity-90">Less CO₂</p>
              </div>
              <div
                className="p-3 rounded-xl text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
                  95%
                </p>
                <p className="text-xs opacity-90">Cleaner Air</p>
              </div>
              <div
                className="p-3 rounded-xl text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
                  3x
                </p>
                <p className="text-xs opacity-90">Efficient</p>
              </div>
            </div>

            {/* Location Display */}
            {userLocation && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium mt-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Serving your location</span>
              </div>
            )}
          </div>
        </div>

        {/* Eco Impact Banner */}
        <div className="mb-6">
          <EcoImpactCard variant="compact" />
        </div>

      {/* Quick Order Cards - Clean Energy Design */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4" style={{
          color: zamgasTheme.colors.semantic.textPrimary,
          fontFamily: zamgasTheme.typography.fontFamily.display,
        }}>
          Quick Order
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {QUICK_ORDER_SIZES.map((size, index) => (
            <div
              key={size}
              onClick={() => handleQuickOrderSelect(size)}
              className={`relative p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 active:scale-95 sm:hover:scale-[1.03] sm:hover:-translate-y-1 ${
                orderForm.cylinder_type === size ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                background: orderForm.cylinder_type === size ? zamgasTheme.gradients.primary : zamgasTheme.colors.semantic.cardBg,
                boxShadow: orderForm.cylinder_type === size ? 
                  `${zamgasTheme.shadows.hover}, 0 0 0 2px white, 0 0 0 4px ${zamgasTheme.colors.primary.forest}` : 
                  zamgasTheme.shadows.small,
                color: orderForm.cylinder_type === size ? 'white' : zamgasTheme.colors.semantic.textPrimary,
                border: orderForm.cylinder_type === size ? 'none' : `2px solid ${zamgasTheme.colors.neutral[200]}`,
              }}
            >
              <div className="flex flex-col items-center text-center">
                <Zap className="h-7 sm:h-9 w-7 sm:w-9 mb-2 transition-transform duration-300" style={{ color: orderForm.cylinder_type === size ? 'white' : zamgasTheme.colors.secondary.amber }} />
                <p className="font-bold text-base sm:text-lg" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>{size}</p>
                <p className="text-xs mt-1 opacity-80">Clean Energy</p>
              </div>
              {preferences?.preferred_cylinder_type === size && (
                <div
                  className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: zamgasTheme.colors.accent.teal,
                    color: 'white',
                    boxShadow: zamgasTheme.shadows.ecoGlow,
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* Mobile-First Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Order Form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold" style={{ 
                color: zamgasTheme.colors.semantic.textPrimary,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}>
                Order Details
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Cylinder Type"
                options={CYLINDER_TYPES}
                value={orderForm.cylinder_type}
                onChange={(e) => {
                  const newType = e.target.value
                  setOrderForm({ ...orderForm, cylinder_type: newType })
                  preferencesAPI.updateCylinderType(newType).catch(() => {})
                }}
              />

              <Input
                label="Quantity"
                type="number"
                min="1"
                value={orderForm.quantity}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })
                }
              />

              <Input
                label="Delivery Address"
                placeholder="Enter your delivery address"
                value={orderForm.delivery_address}
                onChange={(e) => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                required
              />

              {/* Payment Method Selection - Card Based */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Cash', icon: Wallet, color: zamgasTheme.colors.primary.forest },
                    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: zamgasTheme.colors.accent.teal },
                  ].map((method) => {
                    const Icon = method.icon
                    const isSelected = orderForm.payment_method === method.value
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, payment_method: method.value })}
                        className="p-4 rounded-xl transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: isSelected ? method.color + '15' : zamgasTheme.colors.neutral[100],
                          border: `2px solid ${isSelected ? method.color : 'transparent'}`,
                          boxShadow: isSelected ? zamgasTheme.shadows.small : 'none',
                        }}
                      >
                        <Icon
                          className="h-6 w-6 mx-auto mb-2"
                          style={{ color: isSelected ? method.color : zamgasTheme.colors.neutral[500] }}
                        />
                        <p
                          className="text-sm font-semibold"
                          style={{ color: isSelected ? method.color : zamgasTheme.colors.semantic.textSecondary }}
                        >
                          {method.label}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mobile Money Provider Selection */}
              {orderForm.payment_method === 'mobile_money' && (
                <div
                  className="p-4 rounded-xl animate-fade-in space-y-4"
                  style={{
                    background: zamgasTheme.colors.accent.teal + '10',
                    border: `1px solid ${zamgasTheme.colors.accent.teal}30`,
                  }}
                >
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                      Select Mobile Money Provider
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* MTN MoMo */}
                      <button
                        type="button"
                        onClick={() => setMobileMoneyPhone(mobileMoneyPhone.startsWith('+26097') ? mobileMoneyPhone : '+26097')}
                        className="p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center"
                        style={{
                          background: mobileMoneyPhone.includes('97') ? '#FFCC00' : 'white',
                          border: `2px solid ${mobileMoneyPhone.includes('97') ? '#FFCC00' : zamgasTheme.colors.neutral[200]}`,
                          boxShadow: mobileMoneyPhone.includes('97') ? '0 4px 12px rgba(255,204,0,0.3)' : 'none',
                        }}
                      >
                        <div className="w-12 h-8 rounded flex items-center justify-center mb-1" style={{ background: '#FFCC00' }}>
                          <span className="text-xs font-bold text-black">MTN</span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: mobileMoneyPhone.includes('97') ? '#000' : zamgasTheme.colors.semantic.textSecondary }}>MoMo</span>
                      </button>
                      
                      {/* Airtel Money */}
                      <button
                        type="button"
                        onClick={() => setMobileMoneyPhone(mobileMoneyPhone.startsWith('+26096') ? mobileMoneyPhone : '+26096')}
                        className="p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center"
                        style={{
                          background: mobileMoneyPhone.includes('96') ? '#ED1C24' : 'white',
                          border: `2px solid ${mobileMoneyPhone.includes('96') ? '#ED1C24' : zamgasTheme.colors.neutral[200]}`,
                          boxShadow: mobileMoneyPhone.includes('96') ? '0 4px 12px rgba(237,28,36,0.3)' : 'none',
                        }}
                      >
                        <div className="w-12 h-8 rounded flex items-center justify-center mb-1" style={{ background: '#ED1C24' }}>
                          <span className="text-xs font-bold text-white">airtel</span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: mobileMoneyPhone.includes('96') ? '#fff' : zamgasTheme.colors.semantic.textSecondary }}>Money</span>
                      </button>
                      
                      {/* Zamtel */}
                      <button
                        type="button"
                        onClick={() => setMobileMoneyPhone(mobileMoneyPhone.startsWith('+26095') ? mobileMoneyPhone : '+26095')}
                        className="p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center"
                        style={{
                          background: mobileMoneyPhone.includes('95') ? '#00A651' : 'white',
                          border: `2px solid ${mobileMoneyPhone.includes('95') ? '#00A651' : zamgasTheme.colors.neutral[200]}`,
                          boxShadow: mobileMoneyPhone.includes('95') ? '0 4px 12px rgba(0,166,81,0.3)' : 'none',
                        }}
                      >
                        <div className="w-12 h-8 rounded flex items-center justify-center mb-1" style={{ background: '#00A651' }}>
                          <span className="text-xs font-bold text-white">zamtel</span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: mobileMoneyPhone.includes('95') ? '#fff' : zamgasTheme.colors.semantic.textSecondary }}>Kwacha</span>
                      </button>
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: zamgasTheme.colors.accent.tealDark }}>
                      Mobile Money Number
                    </label>
                    <div className="relative">
                      <Smartphone
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                        style={{ color: zamgasTheme.colors.accent.teal }}
                      />
                      <input
                        type="tel"
                        placeholder="+260 97 123 4567"
                        value={mobileMoneyPhone}
                        onChange={(e) => setMobileMoneyPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                        style={{
                          background: 'white',
                          borderColor: zamgasTheme.colors.accent.teal + '50',
                        }}
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: zamgasTheme.colors.accent.tealDark, opacity: 0.8 }}>
                      You'll receive a USSD prompt on this number
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Selected Provider Card with Map */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-bold" style={{ 
                color: zamgasTheme.colors.semantic.textPrimary,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}>
                {userLocation ? 'Nearest Provider' : 'Your Provider'}
              </h2>
              {!isPremiumUser && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    color: zamgasTheme.colors.secondary.amber,
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  <Crown className="h-4 w-4" />
                  <span>Explore More</span>
                </button>
              )}
            </CardHeader>
            <CardBody>
              {isSearchingProvider ? (
                <ProviderSearchingAnimation isSearching={isSearchingProvider} />
              ) : isLoading ? (
                <div className="text-center py-8" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  Loading...
                </div>
              ) : !selectedProvider ? (
                <div className="text-center py-8" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  No provider available
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Provider Card - Clean Energy Themed */}
                  <div
                    className="p-6 rounded-2xl relative overflow-hidden"
                    style={{
                      background: zamgasTheme.gradients.eco,
                      boxShadow: zamgasTheme.shadows.large,
                      color: 'white'
                    }}
                  >
                    {/* Eco pattern */}
                    <div className="absolute top-0 right-0 opacity-10" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10 C60 30, 70 40, 50 50 C30 40, 40 30, 50 10 Z M50 50 C60 60, 70 70, 50 90 C30 70, 40 60, 50 50 Z' fill='white'/%3E%3C/svg%3E")`,
                      width: '200px',
                      height: '200px'
                    }} />
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}>
                          {selectedProvider.name}
                        </h3>
                        <p className="text-sm opacity-90 mb-3" style={{ fontFamily: zamgasTheme.typography.fontFamily.body }}>
                          {selectedProvider.phone_number}
                        </p>

                        {nearestProvider && (
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.25)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: zamgasTheme.shadows.innerGlow,
                              }}
                            >
                              <Navigation className="h-4 w-4" />
                              <span>{nearestProvider.distance.toFixed(1)} km away</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedProvider.rating && (
                        <div
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
                          style={{
                            background: zamgasTheme.colors.secondary.amber,
                            color: 'white',
                            boxShadow: zamgasTheme.shadows.amberGlow,
                          }}
                        >
                          <Star className="h-4 w-4 fill-current" />
                          <span>{selectedProvider.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Mini Map - Mobile Optimized */}
                    {userLocation && selectedProvider.latitude && selectedProvider.longitude && (
                      <div
                        className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-3"
                        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedProvider.latitude},${selectedProvider.longitude}&zoom=13`}
                          allowFullScreen
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {selectedProvider.latitude && selectedProvider.longitude
                          ? `${selectedProvider.latitude.toFixed(4)}, ${selectedProvider.longitude.toFixed(4)}`
                          : 'Location not available'}
                      </span>
                    </div>
                  </div>

                  {/* Premium Upsell */}
                  {!isPremiumUser && (
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="w-full p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
                      style={{
                        background: zamgasTheme.gradients.accent,
                        boxShadow: zamgasTheme.shadows.goldGlow,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                            style={{ background: 'rgba(139, 69, 19, 0.2)' }}
                          >
                            <Crown className="h-6 w-6" style={{ color: zamgasTheme.colors.trust.navy }} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-base" style={{ 
                              color: zamgasTheme.colors.trust.navy,
                              fontFamily: zamgasTheme.typography.fontFamily.display,
                            }}>
                              Unlock Premium
                            </p>
                            <p className="text-sm font-medium" style={{ color: zamgasTheme.colors.trust.navy, opacity: 0.8 }}>
                              Choose from {providers.length} providers
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-bold px-4 py-2 rounded-full" style={{ 
                          background: zamgasTheme.colors.trust.navy, 
                          color: 'white',
                          boxShadow: zamgasTheme.shadows.small,
                        }}>
                          View
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Order Summary & Eco Impact */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Collapsible Carbon Savings Card */}
          <div className="md:block">
            {/* Mobile Collapse Header */}
            <button
              onClick={() => setIsImpactCollapsed(!isImpactCollapsed)}
              className="md:hidden w-full flex items-center justify-between p-4 rounded-t-2xl transition-all"
              style={{
                background: isImpactCollapsed ? zamgasTheme.colors.semantic.cardBg : 'transparent',
                borderBottom: isImpactCollapsed ? `1px solid ${zamgasTheme.colors.neutral[200]}` : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: zamgasTheme.colors.primary.forest }} />
                <span
                  className="font-bold"
                  style={{
                    color: zamgasTheme.colors.semantic.textPrimary,
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  Your Impact
                </span>
              </div>
              <div className="text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                {isImpactCollapsed ? 'Show' : 'Hide'}
              </div>
            </button>
            
            {/* Carbon Savings Card - Collapsible on mobile */}
            <div className={`${isImpactCollapsed ? 'hidden md:block' : 'block'}`}>
              <CarbonSavingsCard orders={userOrders} />
            </div>
          </div>

          {/* Order Summary */}
          <Card className="sticky top-20">
            <CardHeader>
              <h2 className="text-xl font-bold" style={{
                color: zamgasTheme.colors.semantic.textPrimary,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}>
                Order Summary
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: zamgasTheme.colors.primary.mintLight }}
              >
                <Zap className="h-8 w-8" style={{ color: zamgasTheme.colors.primary.forest }} />
                <div>
                  <p className="font-medium" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                    {orderForm.cylinder_type}
                  </p>
                  <p className="text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                    x {orderForm.quantity}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: zamgasTheme.colors.semantic.textSecondary }}>Price per unit</span>
                  <span className="font-medium">K 100.00</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: zamgasTheme.colors.semantic.textSecondary }}>Delivery Fee</span>
                  <span className="font-medium">K 10.00</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: zamgasTheme.colors.semantic.textSecondary }}>Service Charge (5%)</span>
                  <span className="font-medium">K 5.00</span>
                </div>
                <div
                  className="border-t pt-2 mt-2"
                  style={{ borderColor: zamgasTheme.colors.neutral[40] }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                      Total
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{ color: zamgasTheme.colors.primary.forest }}
                    >
                      {formatCurrency((100 * orderForm.quantity + 10 + 5))}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold"
                onClick={handlePlaceOrder}
                isLoading={isOrdering}
                disabled={isOrdering}
                style={{
                  background: zamgasTheme.gradients.primary,
                  boxShadow: zamgasTheme.shadows.hover,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}
              >
                {isOrdering ? 'Placing Order...' : 'Place Clean Energy Order'}
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => router.push('/customer/orders')}
                style={{
                  borderColor: zamgasTheme.colors.primary.forest,
                  color: zamgasTheme.colors.primary.forest,
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                View My Orders
              </Button>

              {/* Clean Energy Badge */}
              <div
                className="p-3 rounded-lg text-center text-xs"
                style={{
                  background: zamgasTheme.colors.primary.mintLight,
                  color: zamgasTheme.colors.primary.forestDark,
                }}
              >
                <div className="flex items-center justify-center gap-1.5 font-semibold">
                  <Shield className="h-3.5 w-3.5" />
                  <span>100% Clean Cooking Energy</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Payment Status Modal */}
      <PaymentStatusModal
        isOpen={showPaymentModal}
        depositId={currentDepositId}
        onClose={() => {
          setShowPaymentModal(false)
          setIsOrdering(false)
          setMobileMoneyPhone('')
        }}
        onSuccess={() => {
          setShowPaymentModal(false)
          setShowOrderSuccessModal(true)
          setIsOrdering(false)
          setMobileMoneyPhone('')
        }}
        onFailure={(error) => {
          setShowPaymentModal(false)
          toast.error(error || 'Payment failed - please try again')
          setIsOrdering(false)
        }}
      />
    </DashboardLayout>
    </>
  )
}
