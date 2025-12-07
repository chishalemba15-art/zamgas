'use client'

import { useEffect, useState } from 'react'
import { Trash2, Lock, Unlock, Eye, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { DataTable } from '@/components/admin/DataTable'
import { adminAPI } from '@/lib/api'
import type { User } from '@/lib/api'
import toast from 'react-hot-toast'

interface UserFilters {
  userType?: 'customer' | 'provider' | 'courier'
  search?: string
  status?: 'active' | 'blocked'
}

export default function UsersPage() {
  const adminStore = useAdminStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<UserFilters>({})
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const limit = 15

  const fetchUsers = async (pageNum: number, searchFilters?: UserFilters) => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllUsers(pageNum, limit, searchFilters?.search)
      setUsers(response.users || [])
      setTotal(response.total || 0)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast.error(error.response?.data?.error || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page, filters)
  }, [page])

  const handleBlockUser = async (userId: string) => {
    const reason = prompt('Enter block reason (required):')
    if (!reason?.trim()) {
      toast.error('Block reason is required')
      return
    }

    try {
      await adminAPI.blockUser(userId, reason)
      toast.success('User blocked successfully')
      fetchUsers(page, filters)
    } catch (error: any) {
      console.error('Failed to block user:', error)
      toast.error(error.response?.data?.error || 'Failed to block user')
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      await adminAPI.unblockUser(userId)
      toast.success('User unblocked successfully')
      fetchUsers(page, filters)
    } catch (error: any) {
      console.error('Failed to unblock user:', error)
      toast.error(error.response?.data?.error || 'Failed to unblock user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return

    try {
      await adminAPI.deleteUser(userId)
      toast.success('User deleted successfully')
      fetchUsers(page, filters)
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast.error(error.response?.data?.error || 'Failed to delete user')
    }
  }

  const handleViewDetails = async (userId: string) => {
    try {
      const user = await adminAPI.getUserById(userId)
      setSelectedUser(user)
      setShowDetailModal(true)
    } catch (error: any) {
      toast.error('Failed to fetch user details')
    }
  }

  const handleFilter = (filterKey: keyof UserFilters, value: any) => {
    const newFilters = { ...filters, [filterKey]: value }
    setFilters(newFilters)
    setPage(1)
    fetchUsers(1, newFilters)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage all user accounts - customers, providers, and couriers</p>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
          <p className="text-gray-600 text-sm font-medium">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
          <p className="text-sm text-gray-600 mt-2">All user types combined</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
          <p className="text-gray-600 text-sm font-medium">👥 Customers</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">24</p>
          <p className="text-sm text-gray-600 mt-2">Active customers</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
          <p className="text-gray-600 text-sm font-medium">🏪 Providers</p>
          <p className="text-3xl font-bold text-green-600 mt-2">12</p>
          <p className="text-sm text-gray-600 mt-2">Gas providers</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
          <p className="text-gray-600 text-sm font-medium">🚚 Couriers</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">5</p>
          <p className="text-sm text-gray-600 mt-2">Delivery couriers</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Users</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
            <select
              value={filters.userType || ''}
              onChange={(e) => handleFilter('userType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="customer">Customers</option>
              <option value="provider">Providers</option>
              <option value="courier">Couriers</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilter('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              onChange={(e) => handleFilter('search', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable<User>
        columns={[
          {
            key: 'name',
            label: 'User',
            width: '25%',
            render: (value, row) => (
              <div>
                <p className="font-medium text-gray-900">{value}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail size={14} /> {row.email}
                </p>
              </div>
            ),
          },
          {
            key: 'phone_number',
            label: 'Contact',
            width: '15%',
            render: (value) => (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} /> {value}
              </div>
            ),
          },
          {
            key: 'user_type',
            label: 'Type',
            width: '12%',
            render: (value) => {
              const typeColors: Record<string, string> = {
                customer: 'bg-blue-100 text-blue-700',
                provider: 'bg-green-100 text-green-700',
                courier: 'bg-purple-100 text-purple-700',
              }
              return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColors[value] || 'bg-gray-100 text-gray-700'}`}>
                  {value}
                </span>
              )
            },
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
            key: 'created_at',
            label: 'Joined',
            width: '15%',
            render: (value) => {
              if (!value) return 'N/A'
              return new Date(value).toLocaleDateString()
            },
          },
        ]}
        data={users}
        actions={[
          {
            label: 'View',
            variant: 'primary',
            icon: <Eye size={16} />,
            onClick: (row) => handleViewDetails(row.id),
          },
          {
            label: 'Block',
            variant: 'secondary',
            icon: <Lock size={16} />,
            onClick: (row) => handleBlockUser(row.id),
          },
          {
            label: 'Delete',
            variant: 'danger',
            icon: <Trash2 size={16} />,
            onClick: (row) => handleDeleteUser(row.id),
          },
        ]}
        loading={loading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
        }}
      />

      {/* User Details Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Full Name</p>
                  <p className="text-lg text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-lg text-gray-900">{selectedUser.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">User Type</p>
                  <p className="text-lg text-gray-900 capitalize">{selectedUser.user_type}</p>
                </div>
                {selectedUser.rating && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-lg text-gray-900">⭐ {selectedUser.rating.toFixed(1)}</p>
                  </div>
                )}
                {selectedUser.latitude && selectedUser.longitude && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-lg text-gray-900">
                      <MapPin size={16} className="inline mr-1" />
                      {selectedUser.latitude.toFixed(4)}, {selectedUser.longitude.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              {selectedUser.profile_image && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Profile Image</p>
                  <img
                    src={selectedUser.profile_image}
                    alt="Profile"
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
