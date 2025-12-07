'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { RevenueLineChart } from '@/components/admin/Charts/RevenueLineChart'
import { OrdersBarChart } from '@/components/admin/Charts/OrdersBarChart'
import { OrdersStatusPieChart } from '@/components/admin/Charts/OrdersStatusPieChart'
import { adminAPI } from '@/lib/api'

export default function AnalyticsPage() {
  const { isLoadingDashboard } = useAdminStore()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
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
  const [analyticsMetrics, setAnalyticsMetrics] = useState({
    totalRevenue: 125750,
    avgOrderValue: 2150,
    totalOrders: 257,
    conversionRate: 72,
    avgDeliveryTime: 35,
    customerSatisfaction: 4.6,
  })

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

        const [revenueData, ordersData] = await Promise.all([
          adminAPI.getRevenueAnalytics(days),
          adminAPI.getOrdersAnalytics(days),
        ])

        // Update revenue trend if available
        if (revenueData && Array.isArray(revenueData)) {
          setRevenueTrend(revenueData)
        }

        // Update orders trend if available
        if (ordersData && Array.isArray(ordersData)) {
          setOrdersTrend(ordersData)
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
        // Keep mock data as fallback
      }
    }

    fetchAnalyticsData()
  }, [timeRange])

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      // TODO: Implement export functionality
      // await adminAPI.exportData('analytics', format)
      console.log(`Exporting analytics as ${format}`)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed insights and metrics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download size={18} />
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Download size={18} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ZK {analyticsMetrics.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-2">↑ 15% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Avg Order Value</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ZK {analyticsMetrics.avgOrderValue.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-2">↑ 8% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsMetrics.totalOrders}</p>
          <p className="text-sm text-green-600 mt-2">↑ 12% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Conversion Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsMetrics.conversionRate}%</p>
          <p className="text-sm text-orange-600 mt-2">↓ 2% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Avg Delivery Time</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsMetrics.avgDeliveryTime} min</p>
          <p className="text-sm text-green-600 mt-2">↓ 5 min improvement</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Customer Satisfaction</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsMetrics.customerSatisfaction}/5.0</p>
          <p className="text-sm text-green-600 mt-2">↑ 0.2 from last period</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h2>
          <RevenueLineChart data={revenueTrend} loading={isLoadingDashboard} />
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status Distribution</h2>
          <OrdersStatusPieChart data={orderStatus} loading={isLoadingDashboard} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Trends</h2>
        <OrdersBarChart data={ordersTrend} loading={isLoadingDashboard} />
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Providers</h3>
          <div className="space-y-3">
            {[
              { name: 'ZamGas Ltd', orders: 45, revenue: 85500 },
              { name: 'Premium Cylinders', orders: 38, revenue: 72300 },
              { name: 'Quick Gas Supply', orders: 32, revenue: 64200 },
              { name: 'City Gas Station', orders: 28, revenue: 56100 },
            ].map((provider, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  <p className="text-sm text-gray-600">{provider.orders} orders</p>
                </div>
                <p className="font-semibold text-gray-900">ZK {provider.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {[
              { name: 'John Banda', orders: 12, spent: 18500 },
              { name: 'Grace Mulenga', orders: 10, spent: 15200 },
              { name: 'Michael Chanda', orders: 8, spent: 14800 },
              { name: 'Mary Kamoto', orders: 7, spent: 11300 },
            ].map((customer, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.orders} orders</p>
                </div>
                <p className="font-semibold text-gray-900">ZK {customer.spent.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
