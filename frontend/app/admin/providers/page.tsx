'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Pause, Plus, X, Building, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { DataTable } from '@/components/admin/DataTable'
import { adminAPI } from '@/lib/api'
import type { Provider } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ProvidersPage() {
  const adminStore = useAdminStore()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const limit = 10

  const [newProvider, setNewProvider] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    address: '',
    business_license: '',
    description: '',
  })

  const fetchProviders = async (pageNum: number, search?: string, status?: string) => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await adminAPI.getAllProviders(pageNum, limit, search, status)
      // setProviders(response.providers)
      // setTotal(response.total)

      // Mock data for now
      setProviders([
        {
          id: '1',
          email: 'zamgas@example.com',
          name: 'ZamGas Ltd',
          phone_number: '+260123456789',
          user_type: 'provider',
          rating: 4.8,
        },
        {
          id: '2',
          email: 'premium@example.com',
          name: 'Premium Cylinders',
          phone_number: '+260123456790',
          user_type: 'provider',
          rating: 4.6,
        },
        {
          id: '3',
          email: 'quickgas@example.com',
          name: 'Quick Gas Supply',
          phone_number: '+260123456791',
          user_type: 'provider',
          rating: 4.3,
        },
        {
          id: '4',
          email: 'citygas@example.com',
          name: 'City Gas Station',
          phone_number: '+260123456792',
          user_type: 'provider',
          rating: 4.1,
        },
      ])
      setTotal(18)
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders(page, undefined, statusFilter || undefined)
  }, [page, statusFilter])

  const handleVerifyProvider = async (providerId: string) => {
    try {
      // TODO: Replace with actual API call
      // await adminAPI.verifyProvider(providerId)
      alert('Provider verified successfully')
      fetchProviders(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to verify provider:', error)
      alert('Failed to verify provider')
    }
  }

  const handleSuspendProvider = async (providerId: string) => {
    const reason = prompt('Enter suspension reason:')
    if (!reason) return

    try {
      // TODO: Replace with actual API call
      // await adminAPI.suspendProvider(providerId, reason)
      alert('Provider suspended successfully')
      fetchProviders(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to suspend provider:', error)
      alert('Failed to suspend provider')
    }
  }

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!newProvider.name || !newProvider.email || !newProvider.phone_number || !newProvider.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (newProvider.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    try {
      setIsSubmitting(true)
      // TODO: Replace with actual API call
      // await adminAPI.createProvider(newProvider)

      toast.success('Provider account created successfully!')
      setShowAddModal(false)
      setNewProvider({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        address: '',
        business_license: '',
        description: '',
      })
      fetchProviders(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to create provider:', error)
      toast.error('Failed to create provider account')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Providers Management</h1>
          <p className="text-gray-600 mt-1">Manage gas providers and verify accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add New Provider
        </button>
      </div>

      {/* Provider Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Providers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Verified</p>
          <p className="text-3xl font-bold text-green-600 mt-2">16</p>
          <p className="text-sm text-gray-600 mt-2">88.9% verified</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Pending Review</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">2</p>
          <p className="text-sm text-gray-600 mt-2">Awaiting verification</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Suspended</p>
          <p className="text-3xl font-bold text-red-600 mt-2">0</p>
          <p className="text-sm text-gray-600 mt-2">No active suspensions</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'verified', 'pending', 'suspended'].map((status) => (
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

      {/* Providers Table */}
      <DataTable<Provider>
        columns={[
          {
            key: 'name',
            label: 'Provider Name',
            width: '25%',
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
            key: 'id',
            label: 'Status',
            width: '15%',
            render: (value) => {
              // Mock status assignment
              const statuses = ['verified', 'verified', 'pending', 'verified']
              const status = statuses[Math.floor(Math.random() * statuses.length)]

              return (
                <div className="flex items-center gap-2">
                  {status === 'verified' ? (
                    <>
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">Verified</span>
                    </>
                  ) : status === 'pending' ? (
                    <>
                      <AlertCircle size={16} className="text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Pending</span>
                    </>
                  ) : (
                    <>
                      <Pause size={16} className="text-red-600" />
                      <span className="text-sm font-medium text-red-700">Suspended</span>
                    </>
                  )}
                </div>
              )
            },
          },
        ]}
        data={providers}
        actions={[
          {
            label: 'Verify',
            variant: 'primary',
            icon: <CheckCircle size={16} />,
            onClick: (row) => handleVerifyProvider(row.id),
            disabled: (row) => Math.random() > 0.5, // Mock: some already verified
          },
          {
            label: 'Suspend',
            variant: 'danger',
            icon: <Pause size={16} />,
            onClick: (row) => handleSuspendProvider(row.id),
          },
        ]}
        loading={loading}
        onSearch={(query) => {
          setPage(1)
          fetchProviders(1, query, statusFilter || undefined)
        }}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Provider</h2>
                <p className="text-gray-600 text-sm mt-1">Create a new provider account</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateProvider} className="p-6">
              <div className="space-y-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building size={20} className="text-blue-600" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newProvider.name}
                        onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ZamGas Ltd"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business License Number
                      </label>
                      <input
                        type="text"
                        value={newProvider.business_license}
                        onChange={(e) => setNewProvider({ ...newProvider, business_license: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="BL-12345"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail size={20} className="text-blue-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newProvider.email}
                        onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="provider@zamgas.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={newProvider.phone_number}
                        onChange={(e) => setNewProvider({ ...newProvider, phone_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+260123456789"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-blue-600" />
                    Location
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
                    </label>
                    <textarea
                      value={newProvider.address}
                      onChange={(e) => setNewProvider({ ...newProvider, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main Street, Lusaka, Zambia"
                    />
                  </div>
                </div>

                {/* Account Credentials */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Account Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={newProvider.password}
                        onChange={(e) => setNewProvider({ ...newProvider, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Minimum 8 characters"
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newProvider.description}
                        onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Provider Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
