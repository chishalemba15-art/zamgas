/**
 * ZAMGAS Mobile Auth Store
 * Zustand store with AsyncStorage persistence
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { User, setAuthToken, removeAuthToken } from './api'

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean

    // Actions
    setAuth: (user: User, token: string) => Promise<void>
    logout: () => Promise<void>
    setLoading: (loading: boolean) => void
    updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            setAuth: async (user: User, token: string) => {
                await setAuthToken(token)
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                })
            },

            logout: async () => {
                await removeAuthToken()
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                })
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading })
            },

            updateUser: (userData: Partial<User>) => {
                const currentUser = get().user
                if (currentUser) {
                    set({ user: { ...currentUser, ...userData } })
                }
            },
        }),
        {
            name: 'zamgas-auth',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // After rehydration, set loading to false
                state?.setLoading(false)
            },
        }
    )
)
