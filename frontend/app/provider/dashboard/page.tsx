'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { orderAPI, inventoryAPI, type Order, type InventoryItem } from '@/lib/api'
import { Package, Clock, TrendingUp, CheckCircle, Truck, User, AlertTriangle, Box } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { zamgasTheme } from '@/lib/zamgas-theme'
import toast from 'react-hot-toast'
import axios from 'axios'

interface CourierAvailability {
  id: string  
  name: string
  phone: string
  activeOrders: number
  available: boolean
}

export default function ProviderDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [couriers, setCouriers] = useState<CourierAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    delivered: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [ordersData, inventoryData] = await Promise.all([
        orderAPI.getProviderOrders(),
        inventoryAPI.getProviderInventory().catch(() => []),
      ])

      const ordersArray = ordersData || []
      setOrders(ordersArray)
      setInventory(Array.isArray(inventoryData) ? inventoryData : [])

      // Calculate stats
      setStats({
        total: ordersArray.length,
        pending: ordersArray.filter(o => o.status === 'pending').length,
        active: ordersArray.filter(o => o.status === 'accepted' || o.status === 'in-transit').length,
        delivered: ordersArray.filter(o => o.status === 'delivered').length,
      })

      // Fetch available couriers if there are active/pending orders
      if (ordersArray.some(o => o.status === 'pending' || o.status === 'accepted' || o.status === 'in-transit')) {
        await fetchAvailableCouriers()
      }
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableCouriers = async () => {
    try {
      // Mock courier data - in real app, call API endpoint
      const mockCouriers: CourierAvailability[] = [
        { id: '1', name: 'Courier Alpha', phone: '+260971234567', activeOrders: 1, available: true },
        { id: '2', name: 'Courier Beta', phone: '+260977654321', activeOrders: 2, available: true},
        { id: '3', name: 'Courier Gamma', phone: '+260965432109', activeOrders: 3, available: false },
      ]
      setCouriers(mockCouriers)
    } catch (error) {
      console.log('Failed to fetch couriers')
    }
  }

  const lowStockItems = inventory.filter(item => item.stock_quantity <= 10 && item.stock_quantity > 0)
  const outOfStockItems = inventory.filter(item => item.stock_quantity === 0)

  return (
    <DashboardLayout title="Provider Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Package, label: 'Total', value: stats.total, color: zamgasTheme.colors.primary.forest },
            { icon: Clock, label: 'Pending', value: stats.pending, color: zamgasTheme.colors.secondary.amber },
            { icon: TrendingUp, label: 'Active', value: stats.active, color: zamgasTheme.colors.accent.teal },
            { icon: CheckCircle, label: 'Delivered', value: stats.delivered, color: zamgasTheme.colors.semantic.success },
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
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{
                    color: zamgasTheme.colors.semantic.textPrimary,
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  {stat.label} Orders
                </p>
              </div>
            )
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Orders & Stock (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-bold"
                  style={{
                    color: zamgasTheme.colors.semantic.textPrimary,
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  Recent Orders
                </h3>
                <button
                  onClick={() => router.push('/provider/orders')}
                  className="text-sm font-medium transition-colors hover:underline"
                  style={{ color: zamgasTheme.colors.primary.forest }}
                >
                  View All →
                </button>
              </div>

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
                </div>
              ) : orders.length === 0 ? (
                <div
                  className="p-8 rounded-2xl text-center"
                  style={{
                    background: zamgasTheme.gradients.eco,
                    boxShadow: zamgasTheme.shadows.medium,
                  }}
                >
                  <Package className="h-12 w-12 mx-auto mb-3 text-white opacity-80" />
                  <p className="text-white font-semibold">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => router.push('/provider/orders')}
                      className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                      style={{
                        background: zamgasTheme.colors.semantic.cardBg,
                        border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                            {order.cylinder_type} × {order.quantity}
                          </p>
                          <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                            #{order.id.slice(0, 8)} • {formatDateTime(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold" style={{ color: zamgasTheme.colors.primary.forest }}>
                            {formatCurrency(order.grand_total)}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full capitalize"
                            style={{
                              background: order.status === 'delivered' ? zamgasTheme.colors.semantic.success + '20' : zamgasTheme.colors.secondary.amber + '20',
                              color: order.status === 'delivered' ? zamgasTheme.colors.semantic.success : zamgasTheme.colors.secondary.amber,
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stock Overview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-bold"
                  style={{
                    color: zamgasTheme.colors.semantic.textPrimary,
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  Stock Overview
                </h3>
                <button
                  onClick={() => router.push('/provider/inventory')}
                  className="text-sm font-medium transition-colors hover:underline"
                  style={{ color: zamgasTheme.colors.primary.forest }}
                >
                  Manage →
                </button>
              </div>

              {inventory.length === 0 ? (
                <div
                  className="p-6 rounded-xl text-center"
                  style={{
                    background: zamgasTheme.colors.neutral[100],
                  }}
                >
                  <Box className="h-10 w-10 mx-auto mb-2" style={{ color: zamgasTheme.colors.neutral[400] }} />
                  <p className="text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                    No inventory items
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Alerts */}
                  {outOfStockItems.length > 0 && (
                    <div
                      className="p-3 rounded-lg flex items-center gap-2"
                      style={{
                        background: zamgasTheme.colors.semantic.danger + '10',
                        border: `1px solid ${zamgasTheme.colors.semantic.danger}30`,
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" style={{ color: zamgasTheme.colors.semantic.danger }} />
                      <span className="text-sm font-medium" style={{ color: zamgasTheme.colors.semantic.danger }}>
                        {outOfStockItems.length} item(s) out of stock
                      </span>
                    </div>
                  )}
                  {lowStockItems.length > 0 && (
                    <div
                      className="p-3 rounded-lg flex items-center gap-2"
                      style={{
                        background: zamgasTheme.colors.secondary.amber + '10',
                        border: `1px solid ${zamgasTheme.colors.secondary.amber}30`,
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" style={{ color: zamgasTheme.colors.secondary.amber }} />
                      <span className="text-sm font-medium" style={{ color: zamgasTheme.colors.secondary.amber }}>
                        {lowStockItems.length} item(s) low stock
                      </span>
                    </div>
                  )}

                  {/* Top Stock Items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {inventory.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg"
                        style={{
                          background: zamgasTheme.colors.semantic.cardBg,
                          border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                        }}
                      >
                        <p className="font-bold text-sm mb-1" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                          {item.cylinder_type}
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: item.stock_quantity > 10 ? zamgasTheme.colors.semantic.success : 
                                   item.stock_quantity > 0 ? zamgasTheme.colors.secondary.amber :
                                   zamgasTheme.colors.semantic.danger
                          }}
                        >
                          {item.stock_quantity}
                        </p>
                        <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                          units
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Couriers (1/3 width) */}
          <div>
            <h3
              className="text-lg font-bold mb-4"
              style={{
                color: zamgasTheme.colors.semantic.textPrimary,
                fontFamily: zamgasTheme.typography.fontFamily.display,
              }}
            >
              Available Couriers
            </h3>

            {couriers.length === 0 ? (
              <div
                className="p-6 rounded-xl text-center"
                style={{
                  background: zamgasTheme.colors.neutral[100],
                }}
              >
                <Truck className="h-10 w-10 mx-auto mb-2" style={{ color: zamgasTheme.colors.neutral[400] }} />
                <p className="text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  No active orders
                </p>
                <p className="text-xs mt-1" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  Couriers will appear when you have orders
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {couriers.map((courier) => (
                  <div
                    key={courier.id}
                    className="p-4 rounded-xl"
                    style={{
                      background: zamgasTheme.colors.semantic.cardBg,
                      border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                      boxShadow: zamgasTheme.shadows.small,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: courier.available ? zamgasTheme.colors.semantic.success + '20' : zamgasTheme.colors.neutral[200],
                          }}
                        >
                          <User className="h-4 w-4" style={{ color: courier.available ? zamgasTheme.colors.semantic.success : zamgasTheme.colors.neutral[500] }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                            {courier.name}
                          </p>
                          <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                            {courier.phone}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          background: courier.available ? zamgasTheme.colors.semantic.success + '20' : zamgasTheme.colors.neutral[200],
                          color: courier.available ? zamgasTheme.colors.semantic.success : zamgasTheme.colors.neutral[600],
                        }}
                      >
                        {courier.available ? 'Available' : 'Busy'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                      <Truck className="h-3 w-3" />
                      <span>{courier.activeOrders} active deliveries</span>
                    </div>
                  </div>
                ))}

                {/* Info Message */}
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: zamgasTheme.colors.primary.mintLight,
                  }}
                >
                  <p className="text-xs" style={{ color: zamgasTheme.colors.primary.forestDark }}>
                    💡 Couriers are auto-assigned when you accept orders within 10km radius
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
