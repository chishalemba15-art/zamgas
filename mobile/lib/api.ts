/**
 * ZAMGAS Mobile API Service
 * Shared API layer - adapted from web frontend/lib/api.ts
 */

import * as SecureStore from 'expo-secure-store'

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.zamgas.com'

// Token management for React Native
export const getAuthToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync('authToken')
    } catch {
        return null
    }
}

export const setAuthToken = async (token: string): Promise<void> => {
    await SecureStore.setItemAsync('authToken', token)
}

export const removeAuthToken = async (): Promise<void> => {
    await SecureStore.deleteItemAsync('authToken')
}

// Base fetch with auth
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getAuthToken()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
}

// Types
export interface User {
    id: string
    email: string
    name: string
    phone_number?: string
    user_type: 'customer' | 'provider' | 'courier' | 'admin'
    latitude?: number
    longitude?: number
    created_at?: string
}

export interface Provider {
    id: string
    name: string
    email: string
    phone_number?: string
    address?: string
    latitude?: number
    longitude?: number
    rating?: number
    is_active?: boolean
}

export interface Order {
    id: string
    user_id: string
    provider_id: string
    courier_id?: string
    cylinder_type: string
    quantity: number
    delivery_address: string
    delivery_method: string
    payment_method: string
    status: 'pending' | 'accepted' | 'in-transit' | 'delivered' | 'cancelled'
    total_amount?: number
    grand_total?: number
    created_at?: string
    provider?: Provider
    courier?: User
}

export interface UserPreferences {
    id?: string
    user_id?: string
    preferred_cylinder_type?: string
    preferred_provider_id?: string
    saved_delivery_address?: string
}

// Auth API
export const authAPI = {
    login: async (email: string, password: string) => {
        console.log('Attempting login to:', `${API_URL}/auth/signin`)

        try {
            const response = await fetch(`${API_URL}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            // Get response text first
            const text = await response.text()
            console.log('Login response status:', response.status)

            // Try to parse as JSON
            let data
            try {
                data = JSON.parse(text)
            } catch (e) {
                // Response is not JSON (likely HTML error page)
                console.error('Non-JSON response:', text.substring(0, 200))
                throw new Error('Server error. Please try again later.')
            }

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            return data
        } catch (error: any) {
            console.error('Login error:', error.message)
            throw error
        }
    },

    register: async (data: { name: string; email: string; phone_number: string; password: string; user_type: string }) => {
        console.log('Attempting registration to:', `${API_URL}/auth/signup`)

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    expoPushToken: '', // Required by the backend
                }),
            })

            // Get response text first
            const text = await response.text()
            console.log('Register response status:', response.status)

            // Try to parse as JSON
            let result
            try {
                result = JSON.parse(text)
            } catch (e) {
                // Response is not JSON
                console.error('Non-JSON response:', text.substring(0, 200))
                throw new Error('Server error. Please try again later.')
            }

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed')
            }

            return result
        } catch (error: any) {
            console.error('Register error:', error.message)
            throw error
        }
    },
}

// User API
export const userAPI = {
    getProfile: () => fetchWithAuth('/user/profile'),

    updateProfile: (data: Partial<User>) =>
        fetchWithAuth('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    updateLocation: (latitude: number, longitude: number) =>
        fetchWithAuth('/user/location', {
            method: 'PUT',
            body: JSON.stringify({ latitude, longitude }),
        }),
}

// Provider API
export const providerAPI = {
    getAll: () => fetchWithAuth('/providers'),
    getById: (id: string) => fetchWithAuth(`/providers/${id}`),
    getBest: () => fetchWithAuth('/customer/best', { method: 'POST' }),
}

// Order API
export const orderAPI = {
    create: (order: Partial<Order>) =>
        fetchWithAuth('/user/orders/create', {
            method: 'POST',
            body: JSON.stringify(order),
        }),

    getUserOrders: () => fetchWithAuth('/user/orders'),

    getById: (id: string) => fetchWithAuth(`/orders/${id}`),

    cancel: (id: string) =>
        fetchWithAuth(`/orders/${id}/cancel`, { method: 'POST' }),

    updatePaymentStatus: (id: string, status: string) =>
        fetchWithAuth(`/user/orders/${id}/payment-status`, {
            method: 'PUT',
            body: JSON.stringify({ payment_status: status }),
        }),
}

// Preferences API
export const preferencesAPI = {
    get: () => fetchWithAuth('/customer/preferences'),

    upsert: (prefs: UserPreferences) =>
        fetchWithAuth('/customer/preferences', {
            method: 'PUT',
            body: JSON.stringify(prefs),
        }),

    updateCylinderType: (cylinderType: string) =>
        fetchWithAuth('/customer/preferences/cylinder', {
            method: 'PUT',
            body: JSON.stringify({ cylinder_type: cylinderType }),
        }),
}

// Nearest Provider API
export const nearestProviderAPI = {
    get: () => fetchWithAuth('/customer/nearest-provider', { method: 'POST' }),
}

// Payments API
export const paymentsAPI = {
    initiateDeposit: async (orderId: string, amount: number, phoneNumber: string) => {
        const token = await getAuthToken()
        const response = await fetch(`${API_URL}/payments/deposit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
                order_id: orderId,
                amount,
                phone_number: phoneNumber,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Payment initiation failed')
        }

        return response.json()
    },

    checkStatus: (depositId: string) =>
        fetchWithAuth(`/payments/status/${depositId}`),
}
