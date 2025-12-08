'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { orderAPI, type Order } from '@/lib/api'
import { Package, Clock, MapPin, ChevronDown, ChevronUp, Copy, CheckCircle, Truck, XCircle, Zap, Phone, Navigation } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { zamgasTheme } from '@/lib/zamgas-theme'
import toast from 'react-hot-toast'

type FilterStatus = 'all' | 'pending' | 'in-transit' | 'delivered'

export default function CustomerOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getUserOrders()
      setOrders(data || [])
    } catch (error) {
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setIsLoading(false)
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

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId)
    toast.success('Order ID copied!')
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          background: `${zamgasTheme.colors.semantic.success}20`,
          color: zamgasTheme.colors.semantic.success,
          icon: CheckCircle,
          label: '✓ Delivered'
        }
      case 'in-transit':
        return {
          background: `${zamgasTheme.colors.semantic.info}20`,
          color: zamgasTheme.colors.semantic.info,
          icon: Truck,
          label: '🚚 En Route'
        }
      case 'rejected':
        return {
          background: `${zamgasTheme.colors.semantic.danger}20`,
          color: zamgasTheme.colors.semantic.danger,
          icon: XCircle,
          label: '✗ Rejected'
        }
      case 'accepted':
        return {
          background: `${zamgasTheme.colors.premium.gold}20`,
          color: zamgasTheme.colors.premium.gold,
          icon: CheckCircle,
          label: '✓ Accepted'
        }
      default: // pending
        return {
          background: `${zamgasTheme.colors.secondary.amber}20`,
          color: zamgasTheme.colors.secondary.amber,
          icon: Clock,
          label: '⏳ Pending'
        }
    }
  }

  const filterOrders = (orders: Order[]) => {
    if (activeFilter === 'all') return orders
    return orders.filter(order => {
      if (activeFilter === 'in-transit') return order.status === 'in-transit'
      return order.status === activeFilter
    })
  }

  const filteredOrders = filterOrders(orders)

  const getFilterCount = (filter: FilterStatus) => {
    if (filter === 'all') return orders.length
    return orders.filter(o => o.status === filter || (filter === 'in-transit' && o.status === 'in-transit')).length
  }

  return (
    <DashboardLayout title="My Orders">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold" style={{ 
            color: zamgasTheme.colors.premium.gold,
            fontFamily: zamgasTheme.typography.fontFamily.display,
          }}>
            Order History
          </h1>
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
              color: 'white',
            }}
          >
            + New Order
          </button>
        </div>

        {/* Filter Chips - Dark Theme */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {([
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'in-transit', label: 'In Transit' },
            { key: 'delivered', label: 'Delivered' },
          ] as const).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className="px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all active:scale-95 flex items-center gap-2"
              style={{
                background: activeFilter === filter.key
                  ? `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`
                  : zamgasTheme.colors.premium.burgundyLight,
                color: activeFilter === filter.key
                  ? 'white'
                  : zamgasTheme.colors.premium.gray,
                border: activeFilter === filter.key
                  ? `1px solid ${zamgasTheme.colors.premium.gold}`
                  : `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
                fontFamily: zamgasTheme.typography.fontFamily.body,
              }}
            >
              <span>{filter.label}</span>
              <span
                className="px-1.5 py-0.5 rounded-lg text-xs font-bold"
                style={{
                  background: activeFilter === filter.key
                    ? 'rgba(255, 255, 255, 0.25)'
                    : `${zamgasTheme.colors.premium.gray}30`,
                  color: activeFilter === filter.key ? 'white' : zamgasTheme.colors.premium.gray,
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
              background: zamgasTheme.colors.premium.burgundy,
              border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            }}
          >
            <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full mx-auto"
              style={{ borderColor: zamgasTheme.colors.premium.gold, borderTopColor: 'transparent' }}
            />
            <p className="mt-4" style={{ color: zamgasTheme.colors.premium.gray }}>
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            className="p-8 sm:p-12 rounded-2xl text-center"
            style={{
              background: zamgasTheme.colors.premium.burgundy,
              border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            }}
          >
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: `${zamgasTheme.colors.premium.red}30` }}
            >
              <Package className="h-8 w-8" style={{ color: zamgasTheme.colors.premium.gold }} />
            </div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ 
                color: zamgasTheme.colors.premium.gold,
                fontFamily: zamgasTheme.typography.fontFamily.display 
              }}
            >
              {activeFilter === 'all' ? 'No orders yet' : `No ${activeFilter} orders`}
            </h3>
            <p className="mb-6" style={{ color: zamgasTheme.colors.premium.gray }}>
              {activeFilter === 'all'
                ? 'Place your first order to see it here'
                : `You don't have any ${activeFilter} orders right now`}
            </p>
            {activeFilter === 'all' && (
              <button
                onClick={() => router.push('/customer/dashboard')}
                className="px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                  color: 'white',
                  boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}50`,
                }}
              >
                🔥 Place Your First Order
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id)
              const statusStyle = getStatusBadgeStyle(order.status)
              const StatusIcon = statusStyle.icon

              return (
                <div
                  key={order.id}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: zamgasTheme.colors.premium.burgundy,
                    boxShadow: isExpanded ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
                  }}
                >
                  {/* Compact View */}
                  <div
                    className="p-4 cursor-pointer transition-all"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="font-bold text-sm"
                            style={{
                              color: '#FFFFFF',
                              fontFamily: zamgasTheme.typography.fontFamily.display,
                            }}
                          >
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyOrderId(order.id)
                            }}
                            className="p-1 rounded transition-colors"
                            style={{ background: zamgasTheme.colors.premium.burgundyLight }}
                          >
                            <Copy className="h-3 w-3" style={{ color: zamgasTheme.colors.premium.gray }} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDateTime(order.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div
                          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                          style={{
                            background: statusStyle.background,
                          }}
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: statusStyle.color }}
                          >
                            {statusStyle.label}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                        ) : (
                          <ChevronDown className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gray }} />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" style={{ color: zamgasTheme.colors.premium.gold }} />
                        <span className="font-medium text-sm" style={{ color: '#FFFFFF' }}>
                          {order.cylinder_type} × {order.quantity}
                        </span>
                      </div>
                      <p
                        className="text-xl font-bold"
                        style={{
                          color: zamgasTheme.colors.premium.gold,
                          fontFamily: zamgasTheme.typography.fontFamily.display,
                        }}
                      >
                        {formatCurrency(order.grand_total)}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 pt-2 border-t space-y-4"
                      style={{ borderColor: `${zamgasTheme.colors.premium.gray}20` }}
                    >
                      {/* Payment & Status Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: zamgasTheme.colors.premium.burgundyLight }}
                        >
                          <p className="text-xs mb-1" style={{ color: zamgasTheme.colors.premium.gray }}>
                            Payment Method
                          </p>
                          <p className="font-medium text-sm capitalize" style={{ color: '#FFFFFF' }}>
                            {order.payment_method.replace('_', ' ')}
                          </p>
                        </div>
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: zamgasTheme.colors.premium.burgundyLight }}
                        >
                          <p className="text-xs mb-1" style={{ color: zamgasTheme.colors.premium.gray }}>
                            Payment Status
                          </p>
                          <p className="font-medium text-sm capitalize" style={{ 
                            color: order.payment_status === 'paid' 
                              ? zamgasTheme.colors.semantic.success 
                              : zamgasTheme.colors.premium.gold 
                          }}>
                            {order.payment_status}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: zamgasTheme.colors.premium.burgundyLight }}
                      >
                        <p className="text-xs mb-2" style={{ color: zamgasTheme.colors.premium.gray }}>
                          Delivery Address
                        </p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: zamgasTheme.colors.premium.gold }} />
                          <p className="font-medium text-sm" style={{ color: '#FFFFFF' }}>
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>

                      {/* Courier Info - if assigned */}
                      {order.courier_name && (
                        <div
                          className="p-3 rounded-xl flex items-center justify-between"
                          style={{ 
                            background: `${zamgasTheme.colors.semantic.info}15`,
                            border: `1px solid ${zamgasTheme.colors.semantic.info}30`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ background: zamgasTheme.colors.semantic.info, color: 'white' }}
                            >
                              {order.courier_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                                {order.courier_name}
                              </p>
                              <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>
                                Your Courier
                              </p>
                            </div>
                          </div>
                          {order.courier_phone && (
                            <a
                              href={`tel:${order.courier_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl transition-all active:scale-95"
                              style={{ 
                                background: zamgasTheme.colors.semantic.info,
                                color: 'white',
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Tracking Info */}
                      {order.current_address && order.status === 'in-transit' && (
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            background: `${zamgasTheme.colors.semantic.info}15`,
                            border: `1px solid ${zamgasTheme.colors.semantic.info}30`,
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Navigation className="h-5 w-5 flex-shrink-0 animate-pulse" style={{ color: zamgasTheme.colors.semantic.info }} />
                            <div>
                              <p className="text-sm font-semibold mb-1" style={{ color: zamgasTheme.colors.semantic.info }}>
                                Live Location
                              </p>
                              <p className="text-sm" style={{ color: '#FFFFFF' }}>
                                {order.current_address}
                              </p>
                            </div>
                          </div>
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
