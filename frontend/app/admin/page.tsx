'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, DollarSign, Store } from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { StatsCard } from '@/components/admin/StatsCard'
import { RevenueLineChart } from '@/components/admin/Charts/RevenueLineChart'
import { OrdersBarChart } from '@/components/admin/Charts/OrdersBarChart'
import { OrdersStatusPieChart } from '@/components/admin/Charts/OrdersStatusPieChart'
import { adminAPI } from '@/lib/api'

export default function AdminDashboard() {
  const { setLoadingDashboard, isLoadingDashboard } = useAdminStore()
  const [stats, setStats] = useState({
    totalUsers: 245,
    activeOrders: 42,
    totalRevenue: 125750,
    activeProviders: 18,
  })
  const [revenueTrend, setRevenueTrend] = useState([
    { date: 'Mon', revenue: 8200 },
    { date: 'Tue', revenue: 9500 },
    { date: 'Wed', revenue: 8900 },
    { date: 'Thu', revenue: 11200 },
    { date: 'Fri', revenue: 13500 },
    { date: 'Sat', revenue: 15800 },
    { date: 'Sun', revenue: 12250 },
  ])
  const [ordersTrend, setOrdersTrend] = useState([
    { date: 'Mon', completed: 12, pending: 5, inTransit: 3 },
    { date: 'Tue', completed: 15, pending: 4, inTransit: 4 },
    { date: 'Wed', completed: 14, pending: 6, inTransit: 3 },
    { date: 'Thu', completed: 18, pending: 5, inTransit: 5 },
    { date: 'Fri', completed: 20, pending: 4, inTransit: 6 },
    { date: 'Sat', completed: 22, pending: 3, inTransit: 7 },
    { date: 'Sun', completed: 18, pending: 5, inTransit: 4 },
  ])
  const [orderStatus, setOrderStatus] = useState([
    { name: 'delivered', value: 127 },
    { name: 'pending', value: 32 },
    { name: 'in-transit', value: 28 },
    { name: 'accepted', value: 58 },
    { name: 'rejected', value: 12 },
  ])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingDashboard(true)
        const [dashboardStats, revenueData, ordersData] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getRevenueAnalytics(7),
          adminAPI.getOrdersAnalytics(7),
        ])

        // Update stats if available
        if (dashboardStats) {
          setStats({
            totalUsers: dashboardStats.totalUsers || 245,
            activeOrders: dashboardStats.activeOrders || 42,
            totalRevenue: dashboardStats.totalRevenue || 125750,
            activeProviders: dashboardStats.activeProviders || 18,
          })
        }

        // Update revenue trend if available
        if (revenueData && Array.isArray(revenueData)) {
          setRevenueTrend(revenueData)
        }

        // Update orders trend if available
        if (ordersData && Array.isArray(ordersData)) {
          setOrdersTrend(ordersData)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Keep mock data as fallback
      } finally {
        setLoadingDashboard(false)
      }
    }

    fetchDashboardData()
  }, [setLoadingDashboard])

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to ZamGas Admin Panel</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="text-blue-600" />}
          change={{ value: 12, isPositive: true }}
          loading={isLoadingDashboard}
        />

        <StatsCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={<TrendingUp className="text-green-600" />}
          change={{ value: 8, isPositive: true }}
          loading={isLoadingDashboard}
        />

        <StatsCard
          title="Total Revenue"
          value={`ZK ${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="text-amber-600" />}
          change={{ value: 15, isPositive: true }}
          loading={isLoadingDashboard}
        />

        <StatsCard
          title="Active Providers"
          value={stats.activeProviders}
          icon={<Store className="text-purple-600" />}
          change={{ value: 3, isPositive: true }}
          loading={isLoadingDashboard}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">7-Day Revenue Trend</h2>
          <RevenueLineChart data={revenueTrend} loading={isLoadingDashboard} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status Distribution</h2>
          <OrdersStatusPieChart data={orderStatus} loading={isLoadingDashboard} />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">7-Day Order Trends</h2>
        <OrdersBarChart data={ordersTrend} loading={isLoadingDashboard} />
      </div>

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/users"
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <p className="text-lg font-semibold text-gray-900">👥 Users</p>
            <p className="text-sm text-gray-600 mt-1">Manage user accounts</p>
          </a>

          <a
            href="/admin/providers"
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <p className="text-lg font-semibold text-gray-900">🏪 Providers</p>
            <p className="text-sm text-gray-600 mt-1">Manage gas providers</p>
          </a>

          <a
            href="/admin/orders"
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <p className="text-lg font-semibold text-gray-900">📦 Orders</p>
            <p className="text-sm text-gray-600 mt-1">View and manage orders</p>
          </a>

          <a
            href="/admin/settings"
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <p className="text-lg font-semibold text-gray-900">⚙️ Settings</p>
            <p className="text-sm text-gray-600 mt-1">Platform configuration</p>
          </a>
        </div>
      </div>
    </div>
  )
}
