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

// Cylinder prices mapping (in Kwacha)
const CYLINDER_PRICES: Record<string, number> = {
  '3KG': 45,
  '5KG': 75,
  '6KG': 85,
  '9KG': 120,
  '12KG': 150,
  '13KG': 180,
  '19KG': 290,
  '48KG': 650,
}

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
  const [isImpactCollapsed, setIsImpactCollapsed] = useState(true)
  const [showOrderSheet, setShowOrderSheet] = useState(false)
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
    // Load saved cylinder preference
    const savedCylinder = localStorage.getItem('preferredCylinder')
    if (savedCylinder) {
      setOrderForm(prev => ({ ...prev, cylinder_type: savedCylinder }))
    }
    
    // Load saved delivery address
    const savedAddress = localStorage.getItem('savedDeliveryAddress')
    if (savedAddress) {
      setOrderForm(prev => ({ ...prev, delivery_address: savedAddress }))
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

      // Reverse geocode to get address from coordinates
      try {
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
        )
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeData.results && geocodeData.results.length > 0) {
          const address = geocodeData.results[0].formatted_address
          // Only update if no saved address exists
          const savedAddress = localStorage.getItem('savedDeliveryAddress')
          if (!savedAddress) {
            setOrderForm(prev => ({ ...prev, delivery_address: address }))
            localStorage.setItem('savedDeliveryAddress', address)
            toast.success('Delivery address set from your location!')
          }
        }
      } catch (error) {
        console.error('Failed to reverse geocode:', error)
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
        {/* Active Order Notification - Compact Banner */}
        {userOrders.find(o => ['in-transit', 'accepted', 'pending'].includes(o.status)) && (
          (() => {
            const activeOrder = userOrders.find(o => o.status === 'in-transit') || userOrders.find(o => o.status === 'accepted') || userOrders.find(o => o.status === 'pending')
            if (!activeOrder) return null;
            
            return (
              <div 
                className="mx-[-1.5rem] mt-[-1.5rem] mb-4 px-4 py-2.5 text-white cursor-pointer relative z-20"
                style={{ 
                  background: zamgasTheme.colors.premium.burgundyLight,
                  borderBottom: `2px solid ${activeOrder.status === 'in-transit' ? zamgasTheme.colors.semantic.info : zamgasTheme.colors.premium.gold}`
                }}
                onClick={() => router.push('/customer/orders')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1.5 rounded-lg animate-pulse"
                      style={{ background: activeOrder.status === 'in-transit' ? zamgasTheme.colors.semantic.info : `${zamgasTheme.colors.premium.gold}30` }}
                    >
                      <Truck className="h-4 w-4" style={{ color: activeOrder.status === 'in-transit' ? 'white' : zamgasTheme.colors.premium.gold }} />
                    </div>
                    <div>
                      <p className="font-bold text-xs" style={{ color: zamgasTheme.colors.premium.gold }}>
                        {activeOrder.status === 'in-transit' ? '🚚 En Route' : 
                         activeOrder.status === 'accepted' ? '✓ Accepted' : 
                         '⏳ Processing'}
                      </p>
                      <p className="text-[10px]" style={{ color: zamgasTheme.colors.premium.gray }}>
                        Order #{activeOrder.id.slice(0,6)}
                      </p>
                    </div>
                  </div>
                  <div 
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: `${zamgasTheme.colors.premium.gold}20`, color: zamgasTheme.colors.premium.gold }}
                  >
                    Track <Navigation className="h-3 w-3" />
                  </div>
                </div>
              </div>
            )
          })()
        )}

        {/* Hero Section - Minimized on Mobile */}
        <div
          className="relative -mx-6 -mt-2 mb-4 p-4 sm:p-8 pb-4 sm:pb-10 rounded-b-2xl sm:rounded-b-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundy} 0%, ${zamgasTheme.colors.premium.burgundyDark} 100%)`,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="relative z-10 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                    boxShadow: `0 4px 12px ${zamgasTheme.colors.premium.red}40`,
                  }}
                >
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold" style={{ 
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                    color: zamgasTheme.colors.premium.gold
                  }}>
                    Order Gas
                  </h1>
                  <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                    Fast delivery
                  </p>
                </div>
              </div>
              
              {/* Location pill - Mobile */}
              {userLocation && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                  }}
                  onClick={() => {
                    const newAddress = prompt('Enter your delivery address:', orderForm.delivery_address)
                    if (newAddress) {
                      setOrderForm(prev => ({ ...prev, delivery_address: newAddress }))
                      localStorage.setItem('savedDeliveryAddress', newAddress)
                      toast.success('Address updated!')
                    }
                  }}
                >
                  <MapPin className="h-3 w-3" style={{ color: zamgasTheme.colors.premium.gold }} />
                  <span className="truncate max-w-[100px] sm:max-w-none" style={{ color: zamgasTheme.colors.premium.gray }}>
                    {orderForm.delivery_address ? orderForm.delivery_address.slice(0, 20) + '...' : 'Set address'}
                  </span>
                </div>
              )}
            </div>

            {/* Quick stats - Hidden on mobile */}
            <div className="hidden sm:grid grid-cols-3 gap-3 mt-5">
              <div
                className="p-3 rounded-xl text-center"
                style={{
                  background: `${zamgasTheme.colors.premium.burgundyLight}`,
                  border: `1px solid ${zamgasTheme.colors.premium.gray}30`,
                }}
              >
                <p className="text-2xl font-bold mb-0.5" style={{ 
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                  color: zamgasTheme.colors.premium.gold 
                }}>
                  50%
                </p>
                <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>Less CO₂</p>
              </div>
              <div
                className="p-3 rounded-xl text-center"
                style={{
                  background: `${zamgasTheme.colors.premium.burgundyLight}`,
                  border: `1px solid ${zamgasTheme.colors.premium.gray}30`,
                }}
              >
                <p className="text-2xl font-bold mb-0.5" style={{ 
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                  color: zamgasTheme.colors.premium.gold 
                }}>
                  95%
                </p>
                <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>Cleaner Air</p>
              </div>
              <div
                className="p-3 rounded-xl text-center"
                style={{
                  background: `${zamgasTheme.colors.premium.burgundyLight}`,
                  border: `1px solid ${zamgasTheme.colors.premium.gray}30`,
                }}
              >
                <p className="text-2xl font-bold mb-0.5" style={{ 
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                  color: zamgasTheme.colors.premium.gold 
                }}>
                  3x
                </p>
                <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>Efficient</p>
              </div>
            </div>
          </div>
        </div>

        {/* Eco Impact Banner - Hidden on mobile */}
        <div className="mb-4 hidden sm:block">
          <EcoImpactCard variant="compact" />
        </div>

      {/* Quick Order - Compact Horizontal Pills */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-lg font-bold" style={{
            color: '#FFFFFF',
            fontFamily: zamgasTheme.typography.fontFamily.display,
          }}>
            Select Size
          </h2>
          <span className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>
            K{CYLINDER_PRICES[orderForm.cylinder_type]} × {orderForm.quantity}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {QUICK_ORDER_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => handleQuickOrderSelect(size)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95`}
              style={{
                background: orderForm.cylinder_type === size 
                  ? `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`
                  : zamgasTheme.colors.premium.burgundyLight,
                color: orderForm.cylinder_type === size ? 'white' : zamgasTheme.colors.premium.gray,
                border: orderForm.cylinder_type === size 
                  ? `2px solid ${zamgasTheme.colors.premium.gold}`
                  : `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
                boxShadow: orderForm.cylinder_type === size 
                  ? `0 4px 12px ${zamgasTheme.colors.premium.red}40`
                  : 'none',
              }}
            >
              <span style={{ color: orderForm.cylinder_type === size ? zamgasTheme.colors.premium.gold : 'inherit' }}>{size}</span>
              <span className="ml-1 opacity-70">K{CYLINDER_PRICES[size]}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Mobile-Only: Prominent Provider Map */}
      <div className="lg:hidden mb-4">
        <div 
          className="rounded-2xl overflow-hidden"
          style={{
            background: zamgasTheme.colors.premium.burgundy,
            border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
          }}
        >
          {/* Provider Header */}
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: `${zamgasTheme.colors.premium.gray}20` }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${zamgasTheme.colors.premium.red}30` }}
              >
                <Zap className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: '#FFFFFF' }}>
                  {selectedProvider?.name || 'Finding provider...'}
                </h3>
                <div className="flex items-center gap-2 text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>
                  {nearestProvider && (
                    <span className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" style={{ color: zamgasTheme.colors.premium.gold }} />
                      {nearestProvider.distance.toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
            </div>
            {selectedProvider?.rating && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: zamgasTheme.colors.premium.gold,
                  color: zamgasTheme.colors.premium.burgundy,
                }}
              >
                <Star className="h-3 w-3 fill-current" />
                <span>{selectedProvider.rating}</span>
              </div>
            )}
          </div>
          
          {/* Large Map - Dark Theme Styled */}
          {userLocation && selectedProvider?.latitude && selectedProvider?.longitude ? (
            <div
              className="relative w-full h-52 overflow-hidden"
              style={{ background: zamgasTheme.colors.premium.burgundyLight }}
            >
              {/* Map with dark mode filter */}
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ 
                  border: 0,
                  filter: 'invert(90%) hue-rotate(180deg) saturate(0.8) contrast(0.9)',
                }}
                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedProvider.latitude},${selectedProvider.longitude}&zoom=14`}
                allowFullScreen
              />
              {/* Top edge gradient blend */}
              <div 
                className="absolute top-0 left-0 right-0 h-6 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${zamgasTheme.colors.premium.burgundy} 0%, transparent 100%)`,
                }}
              />
              {/* Bottom edge gradient blend */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
                style={{
                  background: `linear-gradient(to top, ${zamgasTheme.colors.premium.burgundy} 0%, transparent 100%)`,
                }}
              />
              {/* Side gradients for seamless edges */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-3 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, ${zamgasTheme.colors.premium.burgundy} 0%, transparent 100%)`,
                }}
              />
              <div 
                className="absolute top-0 bottom-0 right-0 w-3 pointer-events-none"
                style={{
                  background: `linear-gradient(to left, ${zamgasTheme.colors.premium.burgundy} 0%, transparent 100%)`,
                }}
              />
            </div>
          ) : (
            <div 
              className="h-32 flex items-center justify-center"
              style={{ color: zamgasTheme.colors.premium.gray }}
            >
              {isSearchingProvider ? (
                <ProviderSearchingAnimation isSearching={isSearchingProvider} />
              ) : (
                <span>Enable location to see route</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Full Layout - Hidden on Mobile */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 pb-32 lg:pb-0">
        {/* Order Form - Hidden on Mobile (moved to bottom sheet) */}
        <div className="hidden lg:block lg:col-span-2 space-y-4 sm:space-y-6">
          <div 
            className="rounded-2xl p-6 overflow-hidden"
            style={{
              background: zamgasTheme.colors.premium.burgundy,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ 
              color: zamgasTheme.colors.premium.gold,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}>
              Order Details
            </h2>
            <div className="space-y-4">
              {/* Cylinder Type with Price */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Cylinder Type
                </label>
                <select
                  value={orderForm.cylinder_type}
                  onChange={(e) => {
                    const newType = e.target.value
                    setOrderForm({ ...orderForm, cylinder_type: newType })
                    localStorage.setItem('preferredCylinder', newType)
                    preferencesAPI.updateCylinderType(newType).catch(() => {})
                  }}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: `1px solid ${zamgasTheme.colors.premium.gray}50`,
                    color: '#FFFFFF',
                  }}
                >
                  {CYLINDER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - K{CYLINDER_PRICES[type.value]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOrderForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                    className="w-12 h-12 rounded-xl font-bold text-xl transition-all hover:scale-105"
                    style={{ 
                      background: zamgasTheme.colors.premium.burgundyLight,
                      color: zamgasTheme.colors.premium.gold,
                      border: `1px solid ${zamgasTheme.colors.premium.gold}50`,
                    }}
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold w-12 text-center" style={{ color: '#FFFFFF' }}>
                    {orderForm.quantity}
                  </span>
                  <button
                    onClick={() => setOrderForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                    className="w-12 h-12 rounded-xl font-bold text-xl transition-all hover:scale-105"
                    style={{ 
                      background: zamgasTheme.colors.premium.burgundyLight,
                      color: zamgasTheme.colors.premium.gold,
                      border: `1px solid ${zamgasTheme.colors.premium.gold}50`,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Enter your delivery address"
                  value={orderForm.delivery_address}
                  onChange={(e) => {
                    setOrderForm({ ...orderForm, delivery_address: e.target.value })
                    localStorage.setItem('savedDeliveryAddress', e.target.value)
                  }}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: `1px solid ${zamgasTheme.colors.premium.gray}50`,
                    color: '#FFFFFF',
                  }}
                />
              </div>

              {/* Payment Method Selection - Card Based */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: zamgasTheme.colors.premium.gray }}>
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
            </div>
          </div>

          {/* Selected Provider Card - Compact on Mobile */}
          <div 
            className="rounded-2xl overflow-hidden"
            style={{
              background: zamgasTheme.colors.premium.burgundy,
              border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: `${zamgasTheme.colors.premium.gray}20` }}>
              <h2 className="text-lg font-bold" style={{ 
                color: zamgasTheme.colors.premium.gold,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}>
                {userLocation ? 'Nearest Provider' : 'Your Provider'}
              </h2>
              {!isPremiumUser && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                  style={{ 
                    color: zamgasTheme.colors.premium.gold,
                    background: zamgasTheme.colors.premium.burgundyLight,
                  }}
                >
                  <Crown className="h-3 w-3" />
                  <span>More</span>
                </button>
              )}
            </div>
            
            {/* Content */}
            <div className="p-4">
              {isSearchingProvider ? (
                <ProviderSearchingAnimation isSearching={isSearchingProvider} />
              ) : isLoading ? (
                <div className="text-center py-4" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Loading...
                </div>
              ) : !selectedProvider ? (
                <div className="text-center py-4" style={{ color: zamgasTheme.colors.premium.gray }}>
                  No provider available
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Provider Info - Compact */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${zamgasTheme.colors.premium.red}30` }}
                    >
                      <Zap className="h-6 w-6" style={{ color: zamgasTheme.colors.premium.gold }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate" style={{ color: '#FFFFFF' }}>
                        {selectedProvider.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>
                        {nearestProvider && (
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" style={{ color: zamgasTheme.colors.premium.gold }} />
                            {nearestProvider.distance.toFixed(1)} km
                          </span>
                        )}
                        <span>•</span>
                        <span>{selectedProvider.phone_number}</span>
                      </div>
                    </div>
                    {selectedProvider.rating && (
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                        style={{
                          background: zamgasTheme.colors.premium.gold,
                          color: zamgasTheme.colors.premium.burgundy,
                        }}
                      >
                        <Star className="h-3 w-3 fill-current" />
                        <span>{selectedProvider.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Map - Dark Theme Styled */}
                  {userLocation && selectedProvider.latitude && selectedProvider.longitude && (
                    <div
                      className="relative w-full h-48 sm:h-40 rounded-xl overflow-hidden"
                      style={{ background: zamgasTheme.colors.premium.burgundyLight }}
                    >
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ 
                          border: 0,
                          filter: 'invert(90%) hue-rotate(180deg) saturate(0.8) contrast(0.9)',
                        }}
                        src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedProvider.latitude},${selectedProvider.longitude}&zoom=14`}
                        allowFullScreen
                      />
                      {/* Edge gradients for seamless blend */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-4 pointer-events-none"
                        style={{ background: `linear-gradient(to bottom, ${zamgasTheme.colors.premium.burgundy}80 0%, transparent 100%)` }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-3 pointer-events-none"
                        style={{ background: `linear-gradient(to top, ${zamgasTheme.colors.premium.burgundy}80 0%, transparent 100%)` }}
                      />
                    </div>
                  )}

                  {/* Premium Upsell - Compact */}
                  {!isPremiumUser && (
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="w-full p-3 rounded-xl flex items-center justify-between transition-all active:scale-[0.98]"
                      style={{
                        background: `${zamgasTheme.colors.premium.gold}20`,
                        border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" style={{ color: zamgasTheme.colors.premium.gold }} />
                        <span className="text-sm font-medium" style={{ color: zamgasTheme.colors.premium.gold }}>
                          Explore {providers.length} providers
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ 
                        background: zamgasTheme.colors.premium.gold, 
                        color: zamgasTheme.colors.premium.burgundy,
                      }}>
                        Premium
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary & Eco Impact */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Collapsible Carbon Savings Card */}
          <div>
            {/* Collapse Header - Both mobile and desktop */}
            <button
              onClick={() => setIsImpactCollapsed(!isImpactCollapsed)}
              className="w-full flex items-center justify-between p-4 rounded-2xl transition-all"
              style={{
                background: zamgasTheme.colors.premium.burgundy,
                border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                <span
                  className="font-bold"
                  style={{
                    color: '#FFFFFF',
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  Your Impact
                </span>
              </div>
              <div className="text-sm px-3 py-1 rounded-lg" style={{ 
                color: zamgasTheme.colors.premium.gold,
                background: zamgasTheme.colors.premium.burgundyLight,
              }}>
                {isImpactCollapsed ? 'Show ▼' : 'Hide ▲'}
              </div>
            </button>
            
            {/* Carbon Savings Card - Collapsible */}
            <div className={`${isImpactCollapsed ? 'hidden' : 'block'} mt-2`}>
              <CarbonSavingsCard orders={userOrders} />
            </div>
          </div>

          {/* Order Summary - Desktop Only (sidebar) */}
          <div className="hidden lg:block">
            <div 
              className="sticky top-20 rounded-2xl overflow-hidden"
              style={{
                background: zamgasTheme.colors.premium.burgundy,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
              }}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4" style={{
                  color: zamgasTheme.colors.premium.gold,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}>
                  Order Summary
                </h2>
                
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: zamgasTheme.colors.premium.burgundyLight }}
                  >
                    <div className="p-2 rounded-lg" style={{ background: `${zamgasTheme.colors.premium.red}30` }}>
                      <Zap className="h-6 w-6" style={{ color: zamgasTheme.colors.premium.gold }} />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: '#FFFFFF' }}>
                        {orderForm.cylinder_type}
                      </p>
                      <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                        Quantity: {orderForm.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: zamgasTheme.colors.premium.gray }}>Price per unit</span>
                      <span className="font-medium" style={{ color: '#FFFFFF' }}>K {CYLINDER_PRICES[orderForm.cylinder_type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: zamgasTheme.colors.premium.gray }}>Delivery Fee</span>
                      <span className="font-medium" style={{ color: '#FFFFFF' }}>K 25.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: zamgasTheme.colors.premium.gray }}>Service Charge</span>
                      <span className="font-medium" style={{ color: '#FFFFFF' }}>K 5.00</span>
                    </div>
                    <div
                      className="border-t pt-3 mt-3"
                      style={{ borderColor: `${zamgasTheme.colors.premium.gray}30` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold" style={{ color: '#FFFFFF' }}>
                          Total
                        </span>
                        <span
                          className="text-2xl font-bold"
                          style={{ color: zamgasTheme.colors.premium.gold }}
                        >
                          K {(CYLINDER_PRICES[orderForm.cylinder_type] * orderForm.quantity + 25 + 5).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isOrdering}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                      boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}50`,
                      fontFamily: zamgasTheme.typography.fontFamily.display,
                    }}
                  >
                    {isOrdering ? 'Placing Order...' : '🔥 Place Order'}
                  </button>

                  <button
                    onClick={() => router.push('/customer/orders')}
                    className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: zamgasTheme.colors.premium.burgundyLight,
                      color: zamgasTheme.colors.premium.gray,
                      border: `1px solid ${zamgasTheme.colors.premium.gray}30`,
                    }}
                  >
                    <Package className="h-4 w-4" />
                    View My Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet - Full Order Form */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30">
        {/* Collapsed Bar - Always visible */}
        <div 
          onClick={() => setShowOrderSheet(!showOrderSheet)}
          className="mx-4 rounded-t-2xl cursor-pointer transition-all"
          style={{
            background: zamgasTheme.colors.premium.burgundy,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
            border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            borderBottom: showOrderSheet ? 'none' : undefined,
          }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${zamgasTheme.colors.premium.red}30` }}>
                <Zap className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>
                  {orderForm.cylinder_type} × {orderForm.quantity}
                </p>
                <p className="text-lg font-bold" style={{ color: zamgasTheme.colors.premium.gold }}>
                  K {(CYLINDER_PRICES[orderForm.cylinder_type] * orderForm.quantity + 25 + 5).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlaceOrder()
                }}
                disabled={isOrdering}
                className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                  boxShadow: `0 4px 12px ${zamgasTheme.colors.premium.red}50`,
                }}
              >
                {isOrdering ? '...' : '🔥 Place Order'}
              </button>
              <div 
                className="p-2 rounded-lg"
                style={{ background: zamgasTheme.colors.premium.burgundyLight }}
              >
                <span style={{ color: zamgasTheme.colors.premium.gold }}>
                  {showOrderSheet ? '▼' : '▲'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Sheet */}
        <div 
          className={`mx-4 overflow-y-auto transition-all duration-300 ease-out ${showOrderSheet ? 'max-h-[70vh]' : 'max-h-0'}`}
          style={{
            background: zamgasTheme.colors.premium.burgundy,
            borderLeft: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            borderRight: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            borderBottom: showOrderSheet ? `1px solid ${zamgasTheme.colors.premium.burgundyLight}` : 'none',
            borderRadius: '0 0 16px 16px',
          }}
        >
          <div className="p-4 pt-2 space-y-4">
            {/* Quantity Selector */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: zamgasTheme.colors.premium.gray }}>
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOrderForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  className="w-10 h-10 rounded-xl font-bold text-lg transition-all active:scale-95"
                  style={{ 
                    background: zamgasTheme.colors.premium.burgundyLight,
                    color: zamgasTheme.colors.premium.gold,
                    border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                  }}
                >
                  -
                </button>
                <span className="text-xl font-bold w-8 text-center" style={{ color: '#FFFFFF' }}>
                  {orderForm.quantity}
                </span>
                <button
                  onClick={() => setOrderForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className="w-10 h-10 rounded-xl font-bold text-lg transition-all active:scale-95"
                  style={{ 
                    background: zamgasTheme.colors.premium.burgundyLight,
                    color: zamgasTheme.colors.premium.gold,
                    border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: zamgasTheme.colors.premium.gray }}>
                Delivery Address
              </label>
              <input
                type="text"
                placeholder="Enter your delivery address"
                value={orderForm.delivery_address}
                onChange={(e) => {
                  setOrderForm({ ...orderForm, delivery_address: e.target.value })
                  localStorage.setItem('savedDeliveryAddress', e.target.value)
                }}
                className="w-full px-4 py-3 rounded-xl transition-all outline-none text-sm"
                style={{
                  background: zamgasTheme.colors.premium.burgundyLight,
                  border: `1px solid ${zamgasTheme.colors.premium.gray}30`,
                  color: '#FFFFFF',
                }}
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: zamgasTheme.colors.premium.gray }}>
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setOrderForm({ ...orderForm, payment_method: 'mobile_money' })}
                  className="p-3 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{
                    background: orderForm.payment_method === 'mobile_money' 
                      ? `${zamgasTheme.colors.premium.red}30`
                      : zamgasTheme.colors.premium.burgundyLight,
                    border: orderForm.payment_method === 'mobile_money' 
                      ? `2px solid ${zamgasTheme.colors.premium.gold}`
                      : `1px solid ${zamgasTheme.colors.premium.gray}20`,
                    color: orderForm.payment_method === 'mobile_money' 
                      ? zamgasTheme.colors.premium.gold
                      : zamgasTheme.colors.premium.gray,
                  }}
                >
                  📱 Mobile Money
                </button>
                <button
                  onClick={() => setOrderForm({ ...orderForm, payment_method: 'cash' })}
                  className="p-3 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{
                    background: orderForm.payment_method === 'cash' 
                      ? `${zamgasTheme.colors.premium.red}30`
                      : zamgasTheme.colors.premium.burgundyLight,
                    border: orderForm.payment_method === 'cash' 
                      ? `2px solid ${zamgasTheme.colors.premium.gold}`
                      : `1px solid ${zamgasTheme.colors.premium.gray}20`,
                    color: orderForm.payment_method === 'cash' 
                      ? zamgasTheme.colors.premium.gold
                      : zamgasTheme.colors.premium.gray,
                  }}
                >
                  💵 Cash on Delivery
                </button>
              </div>

              {/* Mobile Money Providers */}
              {orderForm.payment_method === 'mobile_money' && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { id: 'mtn', name: 'MTN', icon: '/mtn_money.png' },
                    { id: 'airtel', name: 'Airtel', icon: '/airtel_money.svg' },
                    { id: 'zamtel', name: 'Zamtel', icon: '/zamtel_money.svg' },
                  ].map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setMobileMoneyPhone(prev => prev.startsWith('+260') ? prev : '+260')}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95"
                      style={{
                        background: zamgasTheme.colors.premium.burgundyLight,
                        border: `1px solid ${zamgasTheme.colors.premium.gray}20`,
                      }}
                    >
                      <img 
                        src={provider.icon} 
                        alt={provider.name} 
                        className="h-8 w-8 object-contain"
                      />
                      <span className="text-[10px]" style={{ color: zamgasTheme.colors.premium.gray }}>
                        {provider.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Money Phone Input */}
            {orderForm.payment_method === 'mobile_money' && (
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Mobile Money Number
                </label>
                <input
                  type="tel"
                  placeholder="+260 97 XXX XXXX"
                  value={mobileMoneyPhone}
                  onChange={(e) => setMobileMoneyPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl transition-all outline-none text-sm"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-3" style={{ borderColor: `${zamgasTheme.colors.premium.gray}20` }}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: zamgasTheme.colors.premium.gray }}>Subtotal</span>
                <span style={{ color: '#FFFFFF' }}>K {CYLINDER_PRICES[orderForm.cylinder_type] * orderForm.quantity}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: zamgasTheme.colors.premium.gray }}>Delivery + Service</span>
                <span style={{ color: '#FFFFFF' }}>K 30.00</span>
              </div>
              <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t" style={{ borderColor: `${zamgasTheme.colors.premium.gray}20` }}>
                <span style={{ color: '#FFFFFF' }}>Total</span>
                <span style={{ color: zamgasTheme.colors.premium.gold }}>
                  K {(CYLINDER_PRICES[orderForm.cylinder_type] * orderForm.quantity + 30).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Large Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isOrdering}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}50`,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}
            >
              {isOrdering ? 'Processing...' : '🔥 Place Order Now'}
            </button>
          </div>
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
