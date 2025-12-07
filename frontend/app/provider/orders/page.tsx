'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { orderAPI, type Order } from '@/lib/api'
import { Package, Clock, MapPin, Phone, User, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { zamgasTheme } from '@/lib/zamgas-theme'
import toast from 'react-hot-toast'

type FilterStatus = 'all' | 'pending' | 'accepted' | 'in-transit' | 'delivered'

interface CourierInfo {
  id: string
  name: string
  phone: string
  rating: number
}

export default function ProviderOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [courierCache, setCourierCache] = useState<Record<string, CourierInfo>>({})

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getProviderOrders()
      setOrders(data || [])
      
      // Fetch courier info for orders with courier_id
      const couriersToFetch = data?.filter(o => o.courier_id && !courierCache[o.courier_id]) || []
      if (couriersToFetch.length > 0) {
        // In a real app, you'd batch fetch these
        // For now, we'll just show the courier_id
      }
    } catch (error) {
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await orderAPI.accept(orderId)
      toast.success('Order accepted! Courier auto-assigned.')
      fetchOrders()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await orderAPI.reject(orderId)
      toast.success('Order rejected')
      fetchOrders()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject order')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          background: zamgasTheme.colors.semantic.success + '15',
          color: zamgasTheme.colors.semantic.success,
          icon: CheckCircle,
        }
      case 'in-transit':
        return {
          background: zamgasTheme.colors.accent.teal + '15',
          color: zamgasTheme.colors.accent.teal,
          icon: Truck,
        }
      case 'rejected':
        return {
          background: zamgasTheme.colors.semantic.danger + '15',
          color: zamgasTheme.colors.semantic.danger,
          icon: XCircle,
        }
      case 'accepted':
        return {
          background: zamgasTheme.colors.primary.mint + '15',
          color: zamgasTheme.colors.primary.forest,
          icon: CheckCircle,
        }
      default:
        return {
          background: zamgasTheme.colors.secondary.amber + '15',
          color: zamgasTheme.colors.secondary.amber,
          icon: Clock,
        }
    }
  }

  const filterOrders = (orders: Order[]) => {
    if (activeFilter === 'all') return orders
    return orders.filter(o => o.status === activeFilter)
  }

  const getFilterCount = (filter: FilterStatus) => {
    if (filter === 'all') return orders.length
    return orders.filter(o => o.status === filter).length
  }

  const filteredOrders = filterOrders(orders)

  return (
    <DashboardLayout title="Orders">
      <div className="space-y-4">
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {([
            { key: 'all', label: 'All' },
            { key:  'pending', label: 'Pending' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'in-transit', label: 'In Transit' },
            { key: 'delivered', label: 'Delivered' },
          ] as const).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className="px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all active:scale-95 flex items-center gap-2"
              style={{
                background: activeFilter === filter.key
                  ? zamgasTheme.gradients.primary
                  : zamgasTheme.colors.neutral[100],
                color: activeFilter === filter.key
                  ? 'white'
                  : zamgasTheme.colors.semantic.textSecondary,
                fontFamily: zamgasTheme.typography.fontFamily.body,
              }}
            >
              <span>{filter.label}</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: activeFilter === filter.key
                    ? 'rgba(255, 255, 255, 0.25)'
                    : zamgasTheme.colors.neutral[200],
                }}
              >
                {getFilterCount(filter.key)}
              </span>
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div
            className="p-8 rounded-2xl text-center"
            style={{
              background: zamgasTheme.colors.semantic.cardBg,
              boxShadow: zamgasTheme.shadows.small,
            }}
          >
            <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full mx-auto"
              style={{ borderColor: zamgasTheme.colors.primary.mint, borderTopColor: 'transparent' }}
            />
            <p className="mt-4" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            className="p-8 sm:p-12 rounded-2xl text-center"
            style={{
              background: zamgasTheme.gradients.eco,
              boxShadow: zamgasTheme.shadows.medium,
            }}
          >
            <Package className="h-16 w-16 mx-auto mb-4 text-white opacity-80" />
            <h3
              className="text-xl font-bold mb-2 text-white"
              style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
            >
              {activeFilter === 'all' ? 'No orders yet' : `No ${activeFilter} orders`}
            </h3>
            <p className="text-white/90">
              {activeFilter === 'all'
                ? 'Orders from customers will appear here'
                : `You don't have any ${activeFilter} orders right now`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id)
              const statusStyle = getStatusStyle(order.status)
              const StatusIcon = statusStyle.icon

              return (
                <div
                  key={order.id}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: zamgasTheme.colors.semantic.cardBg,
                    boxShadow: isExpanded ? zamgasTheme.shadows.medium : zamgasTheme.shadows.small,
                    border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                  }}
                >
                  {/* Compact View */}
                  <div
                    className="p-4 cursor-pointer active:bg-opacity-50 transition-all"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p
                          className="font-bold text-sm mb-1"
                          style={{
                            color: zamgasTheme.colors.semantic.textPrimary,
                            fontFamily: zamgasTheme.typography.fontFamily.display,
                          }}
                        >
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDateTime(order.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div
                          className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                          style={{ background: statusStyle.background }}
                        >
                          <StatusIcon className="h-3.5 w-3.5" style={{ color: statusStyle.color }} />
                          <span className="text-xs font-bold uppercase" style={{ color: statusStyle.color }}>
                            {order.status.replace('-', ' ')}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" style={{ color: zamgasTheme.colors.semantic.textSecondary }} />
                        ) : (
                          <ChevronDown className="h-5 w-5" style={{ color: zamgasTheme.colors.semantic.textSecondary }} />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" style={{ color: zamgasTheme.colors.primary.forest }} />
                        <span className="font-medium text-sm" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                          {order.cylinder_type} × {order.quantity}
                        </span>
                      </div>
                      <p
                        className="text-xl font-bold"
                        style={{
                          color: zamgasTheme.colors.primary.forest,
                          fontFamily: zamgasTheme.typography.fontFamily.display,
                        }}
                      >
                        {formatCurrency(order.grand_total)}
                      </p>
                    </div>

                    {/* Courier Info Badge (if assigned) */}
                    {order.courier_id && (
                      <div
                        className="mt-3 p-2 rounded-lg flex items-center gap-2"
                        style={{
                          background: zamgasTheme.colors.accent.teal + '10',
                          border: `1px solid ${zamgasTheme.colors.accent.teal}30`,
                        }}
                      >
                        <Truck className="h-4 w-4" style={{ color: zamgasTheme.colors.accent.teal }} />
                        <span className="text-xs font-semibold" style={{ color: zamgasTheme.colors.accent.tealDark }}>
                          Courier Assigned
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 pt-2 border-t space-y-4"
                      style={{ borderColor: zamgasTheme.colors.neutral[200] }}
                    >
                      {/* Delivery Address */}
                      <div>
                        <p className="text-xs mb-1" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                          Delivery Address
                        </p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: zamgasTheme.colors.primary.forest }} />
                          <p className="font-medium text-sm" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs mb-1" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                            Payment Method
                          </p>
                          <p className="font-medium text-sm capitalize" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                            {order.payment_method.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                            Payment Status
                          </p>
                          <p className="font-medium text-sm capitalize" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                            {order.payment_status}
                          </p>
                        </div>
                      </div>

                      {/* Courier Details (if assigned) */}
                      {order.courier_id && (
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            background: zamgasTheme.colors.accent.teal + '10',
                            border: `1px solid ${zamgasTheme.colors.accent.teal}30`,
                          }}
                        >
                          <p className="text-sm font-semibold mb-2" style={{ color: zamgasTheme.colors.accent.tealDark }}>
                            Assigned Courier
                          </p>
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5" style={{ color: zamgasTheme.colors.accent.teal }} />
                            <div>
                              <p className="text-sm font-medium" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                                Courier ID: {order.courier_id.slice(0, 8)}
                              </p>
                              <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                                Auto-assigned by system
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons (for pending orders) */}
                      {order.status === 'pending' && (
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAcceptOrder(order.id)
                            }}
                            disabled={actionLoading !== null}
                            className="flex-1 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: zamgasTheme.gradients.primary,
                              color: 'white',
                              boxShadow: zamgasTheme.shadows.medium,
                            }}
                          >
                            {actionLoading === order.id ? 'Accepting...' : 'Accept Order'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRejectOrder(order.id)
                            }}
                            disabled={actionLoading !== null}
                            className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: zamgasTheme.colors.semantic.danger + '15',
                              color: zamgasTheme.colors.semantic.danger,
                            }}
                          >
                            {actionLoading === order.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}