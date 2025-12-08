'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { orderAPI, courierAPI, type Order } from '@/lib/api'
import { Package, MapPin, Phone, TrendingUp, Clock, CheckCircle, Bell, X, Check } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function CourierDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  useEffect(() => {
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
          user_type: (userType || 'courier') as 'customer' | 'provider' | 'courier' | 'admin'
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

    fetchOrders()
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getCourierOrders()
      setOrders(data || [])
    } catch (error) {
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkDeliveredClick = (order: Order) => {
    setSelectedOrder(order)
    setShowCompletionModal(true)
  }

  const confirmMarkDelivered = async () => {
    if (!selectedOrder) return

    setActionLoading(selectedOrder.id)
    try {
      await orderAPI.markDelivered(selectedOrder.id)
      setCompletedOrder(selectedOrder)
      setShowCompletionModal(false)
      setShowReceipt(true)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptAssignment = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await courierAPI.acceptAssignment(orderId)
      toast.success('Job accepted!')
      fetchOrders()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept job')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineAssignment = async (orderId: string) => {
    if (!confirm('Are you sure you want to decline this job?')) return
    
    setActionLoading(orderId)
    try {
      await courierAPI.declineAssignment(orderId)
      toast.success('Job declined')
      fetchOrders()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to decline job')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingOffers = orders.filter(o => o.courier_status === 'pending')
  // Active orders are those accepted by this courier
  const activeOrders = orders.filter(o => o.courier_status === 'accepted' || (o.status === 'in-transit' && o.courier_status !== 'pending'))
  const completedOrders = orders.filter(o => o.status === 'delivered')

  const stats = {
    totalDeliveries: completedOrders.length,
    activeDeliveries: activeOrders.length,
    earnings: completedOrders.reduce((sum, o) => sum + o.delivery_fee, 0),
  }

  return (
    <DashboardLayout title="Courier Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: 'Active', value: stats.activeDeliveries, color: zamgasTheme.colors.accent.teal },
            { icon: CheckCircle, label: 'Completed', value: stats.totalDeliveries, color: zamgasTheme.colors.semantic.success },
            { icon: TrendingUp, label: 'Earnings', value: formatCurrency(stats.earnings), color: zamgasTheme.colors.secondary.amber },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="p-4 rounded-xl"
                style={{
                  background: zamgasTheme.colors.semantic.cardBg,
                  border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                  boxShadow: zamgasTheme.shadows.small,
                }}
              >
                <Icon className="h-5 w-5 mb-2" style={{ color: stat.color }} />
                <p
                  className="text-2xl font-bold mb-1"
                  style={{
                    color: zamgasTheme.colors.semantic.textPrimary,
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* New Job Offers */}
        {pendingOffers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-blue-600 animate-bounce" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <h3
                className="text-lg font-bold"
                style={{
                  color: zamgasTheme.colors.semantic.textPrimary,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}
              >
                New Job Offers ({pendingOffers.length})
              </h3>
            </div>
            <button 
              onClick={fetchOrders}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh Orders"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`}>
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
            </button>

            <div className="space-y-4 mb-8">
              {pendingOffers.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl overflow-hidden border-2 border-blue-100 shadow-lg relative bg-white"
                >
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                    NEW OFFER
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">Delivery Request</h4>
                        <p className="text-gray-500 text-sm">Near {order.delivery_address?.split(',')[0] || 'your location'}</p>
                      </div>
                      <div className="text-right mt-6">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(order.delivery_fee)}</p>
                        <p className="text-xs text-gray-500">Earnings</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="font-semibold text-sm">{order.cylinder_type} × {order.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-semibold text-sm">~2.5 km</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDeclineAssignment(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="h-5 w-5" />
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptAssignment(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold text-white hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                      >
                        {actionLoading === order.id ? (
                          'Accepting...' 
                        ) : (
                          <>
                            <Check className="h-5 w-5" />
                            Accept Job
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Deliveries */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{
              color: zamgasTheme.colors.semantic.textPrimary,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Active Deliveries
          </h3>

          {isLoading ? (
            <div
              className="p-8 rounded-2xl text-center"
              style={{
                background: zamgasTheme.colors.semantic.cardBg,
                boxShadow: zamgasTheme.shadows.small,
              }}
            >
              <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full mx-auto"
                style={{ borderColor: zamgasTheme.colors.primary.mint, borderTopColor:  'transparent' }}
              />
              <p className="mt-4" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                Loading deliveries...
              </p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div
              className="p-8 rounded-2xl text-center"
              style={{
                background: zamgasTheme.gradients.eco,
                boxShadow: zamgasTheme.shadows.medium,
              }}
            >
              <Package className="h-16 w-16 mx-auto mb-4 text-white opacity-80" />
              <h4
                className="text-xl font-bold mb-2 text-white"
                style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
              >
                No active deliveries
              </h4>
              <p className="text-white/90">
                New delivery assignments will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: zamgasTheme.colors.semantic.cardBg,
                    boxShadow: zamgasTheme.shadows.small,
                    border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                  }}
                >
                  <div className="p-4">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p
                          className="font-bold text-sm mb-1"
                          style={{
                            color: zamgasTheme.colors.semantic.textPrimary,
                            fontFamily: zamgasTheme.typography.fontFamily.display,
                          }}
                        >
                          Delivery #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDateTime(order.created_at)}</span>
                        </div>
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-full"
                        style={{
                          background: zamgasTheme.colors.accent.teal + '15',
                          color: zamgasTheme.colors.accent.teal,
                        }}
                      >
                        <span className="text-xs font-bold uppercase">
                          {order.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" style={{ color: zamgasTheme.colors.primary.forest }} />
                          <span className="font-medium text-sm" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                            {order.cylinder_type} × {order.quantity}
                          </span>
                        </div>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: zamgasTheme.colors.primary.forest,
                            fontFamily: zamgasTheme.typography.fontFamily.display,
                          }}
                        >
                          {formatCurrency(order.grand_total)}
                        </p>
                      </div>

                      {/* Delivery Address */}
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          background: zamgasTheme.colors.primary.mintLight,
                        }}
                      >
                        <p className="text-xs font-semibold mb-1" style={{ color: zamgasTheme.colors.primary.forestDark }}>
                          Delivery Address
                        </p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: zamgasTheme.colors.primary.forest }} />
                          <p className="text-sm" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleMarkDeliveredClick(order)}
                          disabled={actionLoading !== null}
                          className="flex-1 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          style={{
                            background: zamgasTheme.gradients.primary,
                            color: 'white',
                            boxShadow: zamgasTheme.shadows.medium,
                          }}
                        >
                          {actionLoading === order.id ? 'Updating...' : 'Mark Delivered'}
                        </button>
                        <button
                          onClick={() => window.open(`tel:${order.delivery_address}`, '_self')}
                          className="px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                          style={{
                            background: zamgasTheme.colors.accent.teal + '15',
                            color: zamgasTheme.colors.accent.teal,
                          }}
                        >
                          <Phone className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Deliveries */}
        {completedOrders.length > 0 && (
          <div>
            <h3
              className="text-lg font-bold mb-4"
              style={{
                color: zamgasTheme.colors.semantic.textPrimary,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}
            >
              Completed ({completedOrders.length})
            </h3>
            <div className="space-y-2">
              {completedOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-xl flex items-center justify-between"
                  style={{
                    background: zamgasTheme.colors.semantic.success + '10',
                    border: `1px solid ${zamgasTheme.colors.semantic.success}30`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5" style={{ color: zamgasTheme.colors.semantic.success }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold" style={{ color: zamgasTheme.colors.semantic.success }}>
                    +{formatCurrency(order.delivery_fee)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Completion Confirmation Modal */}
      {showCompletionModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp"
            style={{ border: `2px solid ${zamgasTheme.colors.primary.mint}` }}
          >
            {/* Header */}
            <div
              className="p-6 text-center"
              style={{ background: zamgasTheme.gradients.primary }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Confirm Delivery?
              </h3>
              <p className="text-white/90 text-sm">
                Are you sure you've delivered this order?
              </p>
            </div>

            {/* Order Summary */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order ID</span>
                  <span className="font-bold text-gray-900">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items</span>
                  <span className="font-semibold text-gray-900">{selectedOrder.cylinder_type} × {selectedOrder.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Earnings</span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: zamgasTheme.colors.primary.forest }}
                  >
                    {formatCurrency(selectedOrder.delivery_fee)}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                <div className="text-amber-600 mt-0.5">ℹ️</div>
                <p className="text-sm text-amber-800">
                  Please ensure the customer has received their order before confirming delivery.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCompletionModal(false)
                    setSelectedOrder(null)
                  }}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{
                    borderColor: zamgasTheme.colors.neutral[300],
                    color: zamgasTheme.colors.semantic.textSecondary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMarkDelivered}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{
                    background: zamgasTheme.gradients.primary,
                    boxShadow: zamgasTheme.shadows.medium,
                  }}
                >
                  {actionLoading ? 'Confirming...' : 'Yes, Delivered'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt & Next Steps Modal */}
      {showReceipt && completedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
            {/* Success Header */}
            <div
              className="p-6 text-center"
              style={{ background: zamgasTheme.gradients.eco }}
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="h-12 w-12" style={{ color: zamgasTheme.colors.semantic.success }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Delivery Complete! 🎉
              </h3>
              <p className="text-white/90">
                Great job! You've earned {formatCurrency(completedOrder.delivery_fee)}
              </p>
            </div>

            {/* Receipt */}
            <div className="p-6 space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">Delivery Receipt</p>
                <p className="text-xs text-gray-400">{formatDateTime(new Date().toISOString())}</p>
              </div>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  Order Summary
                </h4>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order ID</span>
                  <span className="font-mono font-semibold text-gray-900">
                    #{completedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items Delivered</span>
                  <span className="font-semibold text-gray-900">
                    {completedOrder.cylinder_type} × {completedOrder.quantity}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-gray-600">Delivery Address</span>
                  <span className="font-semibold text-gray-900 text-right text-sm max-w-[200px]">
                    {completedOrder.delivery_address}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Order Total</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(completedOrder.grand_total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900">Your Earnings</span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: zamgasTheme.colors.semantic.success }}
                    >
                      +{formatCurrency(completedOrder.delivery_fee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>✨</span>
                  Next Steps
                </h4>

                <div className="space-y-2">
                  <div
                    className="p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      background: zamgasTheme.colors.primary.mintLight,
                      border: `1px solid ${zamgasTheme.colors.primary.mint}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: zamgasTheme.colors.primary.mint }}
                    >
                      <span className="text-xl">⭐</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Rate Your Experience</p>
                      <p className="text-xs text-gray-600">Help us improve our service</p>
                    </div>
                    <div className="text-gray-400">→</div>
                  </div>

                  <div
                    className="p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      background: zamgasTheme.colors.accent.teal + '10',
                      border: `1px solid ${zamgasTheme.colors.accent.teal}40`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: zamgasTheme.colors.accent.teal + '20' }}
                    >
                      <span className="text-xl">💬</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Leave Feedback</p>
                      <p className="text-xs text-gray-600">Share your delivery experience</p>
                    </div>
                    <div className="text-gray-400">→</div>
                  </div>

                  <div
                    className="p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      background: zamgasTheme.colors.secondary.amber + '10',
                      border: `1px solid ${zamgasTheme.colors.secondary.amber}40`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: zamgasTheme.colors.secondary.amber + '20' }}
                    >
                      <span className="text-xl">📊</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">View Earnings</p>
                      <p className="text-xs text-gray-600">Check your daily earnings report</p>
                    </div>
                    <div className="text-gray-400">→</div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowReceipt(false)
                  setCompletedOrder(null)
                }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95 mt-4"
                style={{
                  background: zamgasTheme.gradients.primary,
                  boxShadow: zamgasTheme.shadows.medium,
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
