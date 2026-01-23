import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zamgas-production.up.railway.app'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout to prevent hanging requests
})

// Request interceptor to add auth tokenç
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on signin/admin login pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        // Don't redirect from signin or admin login pages (those handle 401 as part of normal flow)
        if (!currentPath.includes('/auth/signin') && !currentPath.includes('/admin')) {
          // Clear auth and redirect to login for expired tokens on protected pages
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          window.location.href = '/auth/signin'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: string
  email: string
  name: string
  phone_number?: string  // Optional because admin users don't have phone numbers
  user_type: 'customer' | 'provider' | 'courier' | 'admin'
  latitude?: number
  longitude?: number
  profile_image?: string
  rating?: number
  created_at?: string
  updated_at?: string
  // Admin-specific fields
  admin_role?: 'super_admin' | 'manager' | 'analyst' | 'support'
  admin_permissions?: string[]
}

export interface Provider extends User {
  phone_number: string  // Required for providers
  user_type: 'provider'
  distance?: number
}

export interface CylinderPricing {
  id: string
  provider_id: string
  cylinder_type: string
  refill_price: number
  buy_price: number
  stock_quantity: number
}

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'delivered' | 'in-transit' | 'cancelled' | 'completed';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type CylinderType = '6kg' | '13kg' | '25kg' | '50kg';

export interface Order {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_phone: string
  provider_id?: string
  provider_name?: string
  courier_id?: string
  courier_name?: string
  courier_phone?: string
  status: OrderStatus
  courier_status: string
  cylinder_type: CylinderType
  quantity: number
  price_per_unit: number
  total_price: number
  delivery_fee: number
  service_charge: number
  grand_total: number
  delivery_address: string
  delivery_method: string
  payment_method: string
  payment_status: PaymentStatus
  payment_ref?: string
  payment_provider?: string
  current_latitude?: number
  current_longitude?: number
  current_address?: string
  ride_link: string
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  provider_id: string
  cylinder_type: string
  refill_price: number
  buy_price: number
  stock_quantity: number
  created_at: string
  updated_at: string
}

// Auth API (for regular users - customers, providers, couriers)
export const authAPI = {
  signUp: async (data: {
    email: string
    password: string
    name: string
    phone_number: string
    user_type: 'customer' | 'provider'
    expoPushToken: string
  }) => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  signIn: async (email: string, password: string) => {
    const response = await api.post('/auth/signin', { email, password })
    return response.data
  },

  signOut: async () => {
    const response = await api.get('/auth/signout')
    return response.data
  },
}

// Admin Auth API (separate from regular user auth)
export const adminAuthAPI = {
  signIn: async (email: string, password: string) => {
    const response = await api.post('/admin/login', { email, password })
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/admin/me')
    return response.data
  },
}

// User API
export const userAPI = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/user/profile')
    return response.data
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/user/profile', data)
    return response.data
  },

  updateLocation: async (latitude: number, longitude: number) => {
    const response = await api.put('/user/location', { latitude, longitude })
    return response.data
  },
}

// Provider API
export const providerAPI = {
  getAll: async (): Promise<Provider[]> => {
    const response = await api.get('/providers')
    return response.data
  },

  getById: async (id: string): Promise<Provider> => {
    const response = await api.get(`/providers/${id}`)
    return response.data
  },

  getBest: async (): Promise<Provider> => {
    const response = await api.post('/customer/best')
    return response.data
  },

  getCylinderPrice: async (providerId: string, cylinderType: string) => {
    const response = await api.get(`/cylinder-pricing/${providerId}/${cylinderType}`)
    return response.data
  },
}

// Order API
export const orderAPI = {
  create: async (orderData: Partial<Order>) => {
    const response = await api.post('/user/orders/create', orderData)
    return response.data
  },

  getUserOrders: async (): Promise<Order[]> => {
    const response = await api.get('/user/orders')
    return response.data
  },

  getProviderOrders: async (): Promise<Order[]> => {
    const response = await api.get('/provider/orders')
    return response.data
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/provider/orders/${id}`)
    return response.data
  },

  accept: async (id: string) => {
    const response = await api.put(`/provider/orders/${id}/accept`)
    return response.data
  },

  reject: async (id: string) => {
    const response = await api.put(`/provider/orders/${id}/reject`)
    return response.data
  },

  updatePaymentStatus: async (id: string, status: string) => {
    const response = await api.put(`/user/orders/${id}/payment-status`, { payment_status: status })
    return response.data
  },

  markDelivered: async (id: string) => {
    const response = await api.put(`/courier/orders/${id}/update-status`, { status: 'delivered' })
    return response.data
  },

  track: async (id: string) => {
    const response = await api.get(`/orders/${id}/track`)
    return response.data
  },

  getCourierOrders: async (): Promise<Order[]> => {
    const response = await api.get('/courier/orders')
    return response.data
  },
}

// Inventory API
export const inventoryAPI = {
  getProviderInventory: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/provider/inventory')
    return response.data
  },

  addItem: async (item: Partial<InventoryItem>) => {
    const response = await api.post('/provider/inventory', item)
    return response.data
  },

  updateItem: async (id: string, item: Partial<InventoryItem>) => {
    const response = await api.put(`/provider/inventory/${id}`, item)
    return response.data
  },

  updateStock: async (cylinderType: string, quantity: number) => {
    const response = await api.put('/provider/inventory/stock', {
      cylinder_type: cylinderType,
      quantity,
    })
    return response.data
  },
}

// Courier API
export const courierAPI = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get('/courier/orders')
    return response.data
  },

  acceptAssignment: async (orderId: string) => {
    const response = await api.put(`/courier/orders/${orderId}/accept-assignment`)
    return response.data
  },

  declineAssignment: async (orderId: string) => {
    const response = await api.put(`/courier/orders/${orderId}/decline-assignment`)
    return response.data
  },
}

// Payment API
export const paymentAPI = {
  initiateDeposit: async (amount: number, phoneNumber: string) => {
    const response = await api.post('/payments/deposit', {
      amount,
      phone_number: phoneNumber,
    })
    return response.data
  },

  checkStatus: async (depositId: string) => {
    const response = await api.get(`/payments/status/${depositId}`)
    return response.data
  },
}

// Admin API
export const adminAPI = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats')
    return response.data
  },

  // Analytics - Revenue
  getRevenueAnalytics: async (days: number = 7) => {
    const response = await api.get(`/admin/analytics/revenue?days=${days}`)
    return response.data
  },

  // Analytics - Orders
  getOrdersAnalytics: async (days: number = 7) => {
    const response = await api.get(`/admin/analytics/orders?days=${days}`)
    return response.data
  },

  // Analytics - User Growth
  getUserGrowthAnalytics: async (days: number = 30) => {
    const response = await api.get(`/admin/analytics/user-growth?days=${days}`)
    return response.data
  },

  // Users Management
  getAllUsers: async (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.append('search', search)
    const response = await api.get(`/admin/users?${params.toString()}`)
    return response.data
  },

  getUserById: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  updateUser: async (userId: string, data: Partial<User>) => {
    const response = await api.put(`/admin/users/${userId}`, data)
    return response.data
  },

  blockUser: async (userId: string, reason: string) => {
    const response = await api.put(`/admin/users/${userId}/block`, { reason })
    return response.data
  },

  unblockUser: async (userId: string) => {
    const response = await api.put(`/admin/users/${userId}/unblock`)
    return response.data
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  // Providers Management
  getAllProviders: async (page: number = 1, limit: number = 10, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.append('search', search)
    if (status) params.append('status', status)
    const response = await api.get(`/admin/providers?${params.toString()}`)
    return response.data
  },

  getProviderById: async (providerId: string) => {
    const response = await api.get(`/admin/providers/${providerId}`)
    return response.data
  },

  updateProviderStatus: async (providerId: string, status: string) => {
    const response = await api.put(`/admin/providers/${providerId}/status`, { status })
    return response.data
  },

  verifyProvider: async (providerId: string) => {
    const response = await api.put(`/admin/providers/${providerId}/verify`)
    return response.data
  },

  suspendProvider: async (providerId: string, reason: string) => {
    const response = await api.put(`/admin/providers/${providerId}/suspend`, { reason })
    return response.data
  },

  updateProvider: async (providerId: string, data: Partial<Provider>) => {
    const response = await api.put(`/admin/providers/${providerId}`, data)
    return response.data
  },

  // Couriers Management
  getAllCouriers: async (page: number = 1, limit: number = 10, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.append('search', search)
    if (status) params.append('status', status)
    const response = await api.get(`/admin/couriers?${params.toString()}`)
    return response.data
  },

  getCourierById: async (courierId: string) => {
    const response = await api.get(`/admin/couriers/${courierId}`)
    return response.data
  },

  updateCourierStatus: async (courierId: string, status: string) => {
    const response = await api.put(`/admin/couriers/${courierId}/status`, { status })
    return response.data
  },

  suspendCourier: async (courierId: string, reason: string) => {
    const response = await api.put(`/admin/couriers/${courierId}/suspend`, { reason })
    return response.data
  },

  // Orders Management
  getAllOrders: async (page: number = 1, limit: number = 10, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.append('search', search)
    if (status) params.append('status', status)
    const response = await api.get(`/admin/orders?${params.toString()}`)
    return response.data
  },

  assignCourier: async (orderId: string, courierId: string) => {
    const response = await api.put(`/admin/orders/${orderId}/assign-courier`, { courier_id: courierId })
    return response.data
  },

  getOrderById: async (orderId: string) => {
    const response = await api.get(`/admin/orders/${orderId}`)
    return response.data
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put(`/admin/orders/${orderId}/status`, { status })
    return response.data
  },

  moderateOrder: async (orderId: string, action: string, notes?: string) => {
    const response = await api.put(`/admin/orders/${orderId}/moderate`, { action, notes })
    return response.data
  },

  cancelOrder: async (orderId: string, reason: string) => {
    const response = await api.put(`/admin/orders/${orderId}/cancel`, { reason })
    return response.data
  },

  // Disputes/Reports
  getDisputes: async (page: number = 1, limit: number = 10, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.append('status', status)
    const response = await api.get(`/admin/disputes?${params.toString()}`)
    return response.data
  },

  resolveDispute: async (disputeId: string, resolution: string) => {
    const response = await api.put(`/admin/disputes/${disputeId}/resolve`, { resolution })
    return response.data
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/admin/settings')
    return response.data
  },

  updateSettings: async (settings: Record<string, any>) => {
    const response = await api.put('/admin/settings', settings)
    return response.data
  },

  // Reports & Export
  getReports: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/admin/reports?page=${page}&limit=${limit}`)
    return response.data
  },

  exportData: async (type: string, format: 'csv' | 'pdf' = 'csv') => {
    const response = await api.get(`/admin/export/${type}?format=${format}`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Logs & Audit
  getAuditLogs: async (page: number = 1, limit: number = 20) => {
    const response = await api.get(`/admin/logs/audit?page=${page}&limit=${limit}`)
    return response.data
  },

  // Admin User Management
  getAdminUsers: async () => {
    const response = await api.get('/admin/admin-users')
    return response.data
  },

  createAdminUser: async (data: { email: string; password: string; name: string; admin_role: string; permissions?: string[] }) => {
    const response = await api.post('/admin/admin-users', data)
    return response.data
  },

  updateAdminUser: async (adminId: string, data: { name?: string; admin_role?: string; permissions?: string[]; is_active?: boolean }) => {
    const response = await api.put(`/admin/admin-users/${adminId}`, data)
    return response.data
  },

  changeAdminPassword: async (adminId: string, newPassword: string) => {
    const response = await api.put(`/admin/admin-users/${adminId}/password`, { new_password: newPassword })
    return response.data
  },

  deleteAdminUser: async (adminId: string) => {
    const response = await api.delete(`/admin/admin-users/${adminId}`)
    return response.data
  },
}

// Preferences API
export interface UserPreferences {
  id: string
  user_id: string
  preferred_cylinder_type?: string
  preferred_provider_id?: string
  saved_delivery_address?: string
  created_at: string
  updated_at: string
}

export const preferencesAPI = {
  get: async (): Promise<{ preferences: UserPreferences | null }> => {
    const response = await api.get('/customer/preferences')
    return response.data
  },

  upsert: async (data: Partial<UserPreferences>): Promise<{ preferences: UserPreferences }> => {
    const response = await api.put('/customer/preferences', data)
    return response.data
  },

  updateCylinderType: async (cylinderType: string): Promise<{ message: string }> => {
    const response = await api.put('/customer/preferences/cylinder', { cylinder_type: cylinderType })
    return response.data
  },

  updateProvider: async (providerId: string): Promise<{ message: string }> => {
    const response = await api.put('/customer/preferences/provider', { provider_id: providerId })
    return response.data
  },
}

// Nearest Provider API
export interface ProviderWithDistance {
  provider: {
    id: string
    name: string
    email: string
    phone_number: string
    latitude?: number
    longitude?: number
    rating?: number
    user_type: 'provider'
  } & { distance: number }
  distance: number
}

export const nearestProviderAPI = {
  get: async (save: boolean = false): Promise<{ provider: ProviderWithDistance | null; saved: boolean }> => {
    const response = await api.post(`/customer/nearest-provider?save=${save}`)
    return response.data
  },
}

export default api
