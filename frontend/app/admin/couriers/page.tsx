'use client'

import { useEffect, useState } from 'react'
import { Check, X, Pause, Plus, User as UserIcon, Mail, Phone, Car, FileText, Key, Eye, Package, TrendingUp, Calendar, MapPin, Clock, DollarSign, Star, ChevronRight } from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { DataTable } from '@/components/admin/DataTable'
import { adminAPI, orderAPI } from '@/lib/api'
import type { User, Order } from '@/lib/api'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Courier extends User {
  user_type: 'courier'
  vehicle?: string
  license_number?: string
  status?: 'active' | 'inactive' | 'suspended'
}

export default function CouriersPage() {
  const adminStore = useAdminStore()
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCourier, setNewCourier] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    vehicle: '',
    license_number: '',
  })
  const limit = 10

  // Detail view modal state
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [courierOrders, setCourierOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'performance'>('overview')

  const fetchCouriers = async (pageNum: number, search?: string, status?: string) => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllCouriers(pageNum, limit, search, status)
      setCouriers(response.couriers)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to fetch couriers:', error)
      toast.error('Failed to fetch couriers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCouriers(page, undefined, statusFilter || undefined)
  }, [page, statusFilter])

  const handleActivateCourier = async (courierId: string) => {
    try {
      await adminAPI.updateCourierStatus(courierId, 'active')
      toast.success('Courier activated successfully')
      fetchCouriers(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to activate courier:', error)
      toast.error('Failed to activate courier')
    }
  }

  const handleDeactivateCourier = async (courierId: string) => {
    try {
      await adminAPI.updateCourierStatus(courierId, 'inactive')
      toast.success('Courier deactivated successfully')
      fetchCouriers(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to deactivate courier:', error)
      toast.error('Failed to deactivate courier')
    }
  }

  const handleSuspendCourier = async (courierId: string) => {
    const reason = prompt('Enter suspension reason:')
    if (!reason) return

    try {
      await adminAPI.suspendCourier(courierId, reason)
      toast.success('Courier suspended successfully')
      fetchCouriers(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to suspend courier:', error)
      toast.error('Failed to suspend courier')
    }
  }

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!newCourier.name || !newCourier.email || !newCourier.phone_number || !newCourier.password) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate password length
    if (newCourier.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newCourier.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setIsSubmitting(true)
      // TODO: Replace with actual API call
      // await adminAPI.createCourier(newCourier)

      toast.success('Courier account created successfully!')
      setShowAddModal(false)
      // Reset form
      setNewCourier({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        vehicle: '',
        license_number: '',
      })
      // Refresh couriers list
      fetchCouriers(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to create courier:', error)
      toast.error('Failed to create courier account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewCourierDetails = async (courier: Courier) => {
    setSelectedCourier(courier)
    setShowDetailModal(true)
    setActiveTab('overview')

    // Fetch courier's orders
    try {
      setLoadingOrders(true)
      // Note: This assumes there's an endpoint to get orders by courier ID
      // You may need to adjust this based on your actual API
      const response = await adminAPI.getAllOrders(1, 100) // Get all orders
      const courierOrders = response.orders.filter((order: Order) => order.courier_id === courier.id)
      setCourierOrders(courierOrders)
    } catch (error) {
      console.error('Failed to fetch courier orders:', error)
      toast.error('Failed to load courier orders')
      setCourierOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  // Calculate courier performance metrics
  const getCourierMetrics = () => {
    if (!selectedCourier || !courierOrders.length) {
      return {
        totalDeliveries: 0,
        completedDeliveries: 0,
        activeDeliveries: 0,
        totalEarnings: 0,
        avgRating: 0,
        onTimeRate: 0,
      }
    }

    const completed = courierOrders.filter(o => o.status === 'delivered')
    const active = courierOrders.filter(o => o.status === 'in-transit' || o.courier_status === 'accepted')
    const totalEarnings = completed.reduce((sum, order) => sum + (order.delivery_fee || 0), 0)

    return {
      totalDeliveries: courierOrders.length,
      completedDeliveries: completed.length,
      activeDeliveries: active.length,
      totalEarnings,
      avgRating: selectedCourier.rating || 0,
      onTimeRate: completed.length > 0 ? Math.round((completed.length / courierOrders.length) * 100) : 0,
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Couriers Management</h1>
          <p className="text-gray-600 mt-1">Manage delivery couriers and their status</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add New Courier
        </button>
      </div>

      {/* Courier Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Couriers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">9</p>
          <p className="text-sm text-gray-600 mt-2">75% available</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Inactive</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">3</p>
          <p className="text-sm text-gray-600 mt-2">Temporarily offline</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Avg Rating</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">4.6</p>
          <p className="text-sm text-gray-600 mt-2">Out of 5.0</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'active', 'inactive', 'suspended'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === 'all' ? '' : status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              (status === 'all' && !statusFilter) || statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Couriers Table */}
      <DataTable<Courier>
        columns={[
          {
            key: 'name',
            label: 'Courier Name',
            width: '20%',
            render: (value, row) => (
              <div>
                <p className="font-medium text-gray-900">{value}</p>
                <p className="text-sm text-gray-600">{row.email}</p>
              </div>
            ),
          },
          {
            key: 'phone_number',
            label: 'Contact',
            width: '15%',
          },
          {
            key: 'vehicle',
            label: 'Vehicle',
            width: '15%',
            render: (value) => <span className="text-sm">{value || 'N/A'}</span>,
          },
          {
            key: 'license_number',
            label: 'License',
            width: '15%',
            render: (value) => <span className="text-sm font-mono">{value || 'N/A'}</span>,
          },
          {
            key: 'rating',
            label: 'Rating',
            width: '10%',
            render: (value) => (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span className="font-medium text-gray-900">{value?.toFixed(1) || 'N/A'}</span>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            width: '12%',
            render: (value) => (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  value === 'active'
                    ? 'bg-green-100 text-green-700'
                    : value === 'inactive'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {value?.charAt(0).toUpperCase() + value?.slice(1)}
              </span>
            ),
          },
        ]}
        data={couriers}
        actions={[
          {
            label: 'View Details',
            variant: 'secondary',
            icon: <Eye size={16} />,
            onClick: (row) => handleViewCourierDetails(row),
          },
          {
            label: 'Activate',
            variant: 'primary',
            icon: <Check size={16} />,
            onClick: (row) => handleActivateCourier(row.id),
            disabled: (row) => row.status === 'active',
          },
          {
            label: 'Suspend',
            variant: 'danger',
            icon: <Pause size={16} />,
            onClick: (row) => handleSuspendCourier(row.id),
          },
        ]}
        loading={loading}
        onSearch={(query) => {
          setPage(1)
          fetchCouriers(1, query, statusFilter || undefined)
        }}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Add Courier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Courier</h2>
                <p className="text-sm text-gray-600 mt-1">Create a new courier account for deliveries</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateCourier} className="p-6">
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon size={20} className="text-blue-600" />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCourier.name}
                      onChange={(e) => setNewCourier({ ...newCourier, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter courier's full name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail size={20} className="text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newCourier.email}
                      onChange={(e) => setNewCourier({ ...newCourier, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="courier@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newCourier.phone_number}
                      onChange={(e) => setNewCourier({ ...newCourier, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+260123456789"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Car size={20} className="text-blue-600" />
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Details
                    </label>
                    <input
                      type="text"
                      value={newCourier.vehicle}
                      onChange={(e) => setNewCourier({ ...newCourier, vehicle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Toyota Hilux"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={newCourier.license_number}
                      onChange={(e) => setNewCourier({ ...newCourier, license_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., LN12345"
                    />
                  </div>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Key size={20} className="text-blue-600" />
                  Account Credentials
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newCourier.password}
                    onChange={(e) => setNewCourier({ ...newCourier, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Courier Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courier Detail Modal */}
      {showDetailModal && selectedCourier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <UserIcon size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCourier.name}</h2>
                  <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                    <Mail size={14} />
                    {selectedCourier.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedCourier(null)
                  setCourierOrders([])
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex gap-1 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: UserIcon },
                  { id: 'orders', label: 'Order History', icon: Package },
                  { id: 'performance', label: 'Performance', icon: TrendingUp },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Performance Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Total Deliveries</p>
                          <p className="text-2xl font-bold text-blue-900">{getCourierMetrics().totalDeliveries}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <Check size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-green-700 font-medium">Completed</p>
                          <p className="text-2xl font-bold text-green-900">{getCourierMetrics().completedDeliveries}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                          <Clock size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-amber-700 font-medium">Active Orders</p>
                          <p className="text-2xl font-bold text-amber-900">{getCourierMetrics().activeDeliveries}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <DollarSign size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-700 font-medium">Total Earnings</p>
                          <p className="text-2xl font-bold text-purple-900">{formatCurrency(getCourierMetrics().totalEarnings)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Courier Details Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <UserIcon size={20} className="text-blue-600" />
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Mail size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{selectedCourier.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium text-gray-900">{selectedCourier.phone_number}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Joined</p>
                            <p className="font-medium text-gray-900">
                              {selectedCourier.created_at ? formatDateTime(selectedCourier.created_at) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Car size={20} className="text-blue-600" />
                        Vehicle Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Car size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Vehicle</p>
                            <p className="font-medium text-gray-900">{selectedCourier.vehicle || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileText size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">License Number</p>
                            <p className="font-medium text-gray-900 font-mono">{selectedCourier.license_number || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Star size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Rating</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                <span className="font-medium text-gray-900 ml-1">{(selectedCourier.rating || 0).toFixed(1)}</span>
                              </div>
                              <span className="text-sm text-gray-500">/ 5.0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Current Status</h3>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedCourier.status === 'active'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : selectedCourier.status === 'inactive'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {selectedCourier.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  {loadingOrders ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 mt-4">Loading orders...</p>
                    </div>
                  ) : courierOrders.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Package size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 text-lg font-medium">No orders found</p>
                      <p className="text-gray-500 text-sm mt-2">This courier hasn't been assigned any orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courierOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Package size={24} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-lg">Order #{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600 mt-1">{formatDateTime(order.created_at)}</p>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'in-transit'
                                    ? 'bg-blue-100 text-blue-700'
                                    : order.status === 'pending'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {order.status?.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-600">Delivery Address</p>
                                <p className="text-sm font-medium text-gray-900">{order.delivery_address}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-600">Items</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {order.quantity} × {order.cylinder_type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign size={16} className="text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-600">Delivery Fee</p>
                                <p className="text-sm font-medium text-gray-900">{formatCurrency(order.delivery_fee)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Completion Rate</h3>
                        <TrendingUp size={20} className="text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {getCourierMetrics().onTimeRate}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${getCourierMetrics().onTimeRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Average Rating</h3>
                        <Star size={20} className="text-yellow-600" />
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-bold text-gray-900">
                          {getCourierMetrics().avgRating.toFixed(1)}
                        </div>
                        <span className="text-gray-500">/ 5.0</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= getCourierMetrics().avgRating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Total Earnings</h3>
                        <DollarSign size={20} className="text-purple-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {formatCurrency(getCourierMetrics().totalEarnings)}
                      </div>
                      <p className="text-sm text-gray-600">
                        From {getCourierMetrics().completedDeliveries} deliveries
                      </p>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Summary</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-700">Total Deliveries</span>
                        <span className="font-semibold text-gray-900">{getCourierMetrics().totalDeliveries}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-700">Completed Deliveries</span>
                        <span className="font-semibold text-gray-900">{getCourierMetrics().completedDeliveries}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-700">Active Deliveries</span>
                        <span className="font-semibold text-gray-900">{getCourierMetrics().activeDeliveries}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-700">Average Delivery Fee</span>
                        <span className="font-semibold text-gray-900">
                          {getCourierMetrics().completedDeliveries > 0
                            ? formatCurrency(getCourierMetrics().totalEarnings / getCourierMetrics().completedDeliveries)
                            : formatCurrency(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
