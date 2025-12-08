/**
 * ZAMGAS Mobile API Service
 * Shared API layer - adapted from web frontend/lib/api.ts
 */

import * as SecureStore from 'expo-secure-store'

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://zamgas-alb-934347338.us-east-1.elb.amazonaws.com'

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
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Login failed')
        }

        return response.json()
    },

    register: async (data: { name: string; email: string; phone_number: string; password: string; user_type: string }) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Registration failed')
        }

        return response.json()
    },
}

// User API
export const userAPI = {
    getProfile: () => fetchWithAuth('/users/profile'),

    updateProfile: (data: Partial<User>) =>
        fetchWithAuth('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    updateLocation: (latitude: number, longitude: number) =>
        fetchWithAuth('/users/profile', {
            method: 'PUT',
            body: JSON.stringify({ latitude, longitude }),
        }),
}

// Provider API
export const providerAPI = {
    getAll: () => fetchWithAuth('/providers'),
    getById: (id: string) => fetchWithAuth(`/providers/${id}`),
}

// Order API
export const orderAPI = {
    create: (order: Partial<Order>) =>
        fetchWithAuth('/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        }),

    getUserOrders: () => fetchWithAuth('/orders/user'),

    getById: (id: string) => fetchWithAuth(`/orders/${id}`),

    cancel: (id: string) =>
        fetchWithAuth(`/orders/${id}/cancel`, { method: 'POST' }),
}

// Preferences API
export const preferencesAPI = {
    get: () => fetchWithAuth('/preferences'),

    upsert: (prefs: UserPreferences) =>
        fetchWithAuth('/preferences', {
            method: 'PUT',
            body: JSON.stringify(prefs),
        }),

    updateCylinderType: (cylinderType: string) =>
        fetchWithAuth('/preferences', {
            method: 'PUT',
            body: JSON.stringify({ preferred_cylinder_type: cylinderType }),
        }),
}

// Nearest Provider API
export const nearestProviderAPI = {
    get: (premiumOnly: boolean = false) =>
        fetchWithAuth(`/providers/nearest?premium=${premiumOnly}`),
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
