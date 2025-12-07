import { create } from 'zustand'

export type AdminFilter = {
  page: number
  limit: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type ModalState = {
  isOpen: boolean
  title?: string
  data?: any
}

interface AdminState {
  // Filters
  userFilters: AdminFilter
  providerFilters: AdminFilter
  courierFilters: AdminFilter
  orderFilters: AdminFilter

  // Selected items
  selectedUsers: string[]
  selectedProviders: string[]
  selectedCouriers: string[]
  selectedOrders: string[]

  // Modal states
  userModal: ModalState
  providerModal: ModalState
  courierModal: ModalState
  orderModal: ModalState
  actionModal: ModalState

  // Loading states
  isLoadingUsers: boolean
  isLoadingProviders: boolean
  isLoadingCouriers: boolean
  isLoadingOrders: boolean
  isLoadingDashboard: boolean

  // Error states
  userError: string | null
  providerError: string | null
  courierError: string | null
  orderError: string | null

  // Filter actions
  setUserFilters: (filters: Partial<AdminFilter>) => void
  setProviderFilters: (filters: Partial<AdminFilter>) => void
  setCourierFilters: (filters: Partial<AdminFilter>) => void
  setOrderFilters: (filters: Partial<AdminFilter>) => void

  resetUserFilters: () => void
  resetProviderFilters: () => void
  resetCourierFilters: () => void
  resetOrderFilters: () => void

  // Selection actions
  toggleUserSelection: (userId: string) => void
  toggleProviderSelection: (providerId: string) => void
  toggleCourierSelection: (courierId: string) => void
  toggleOrderSelection: (orderId: string) => void

  clearUserSelection: () => void
  clearProviderSelection: () => void
  clearCourierSelection: () => void
  clearOrderSelection: () => void

  // Modal actions
  openUserModal: (data?: any) => void
  closeUserModal: () => void
  openProviderModal: (data?: any) => void
  closeProviderModal: () => void
  openCourierModal: (data?: any) => void
  closeCourierModal: () => void
  openOrderModal: (data?: any) => void
  closeOrderModal: () => void
  openActionModal: (title: string, data?: any) => void
  closeActionModal: () => void

  // Loading actions
  setLoadingUsers: (loading: boolean) => void
  setLoadingProviders: (loading: boolean) => void
  setLoadingCouriers: (loading: boolean) => void
  setLoadingOrders: (loading: boolean) => void
  setLoadingDashboard: (loading: boolean) => void

  // Error actions
  setUserError: (error: string | null) => void
  setProviderError: (error: string | null) => void
  setCourierError: (error: string | null) => void
  setOrderError: (error: string | null) => void

  // Reset
  resetAllStates: () => void
}

const defaultFilter: AdminFilter = {
  page: 1,
  limit: 10,
  sortOrder: 'desc',
}

export const useAdminStore = create<AdminState>((set) => ({
  // Filters
  userFilters: defaultFilter,
  providerFilters: defaultFilter,
  courierFilters: defaultFilter,
  orderFilters: defaultFilter,

  // Selected items
  selectedUsers: [],
  selectedProviders: [],
  selectedCouriers: [],
  selectedOrders: [],

  // Modal states
  userModal: { isOpen: false },
  providerModal: { isOpen: false },
  courierModal: { isOpen: false },
  orderModal: { isOpen: false },
  actionModal: { isOpen: false },

  // Loading states
  isLoadingUsers: false,
  isLoadingProviders: false,
  isLoadingCouriers: false,
  isLoadingOrders: false,
  isLoadingDashboard: false,

  // Error states
  userError: null,
  providerError: null,
  courierError: null,
  orderError: null,

  // Filter actions
  setUserFilters: (filters) =>
    set((state) => ({
      userFilters: { ...state.userFilters, ...filters, page: 1 },
    })),

  setProviderFilters: (filters) =>
    set((state) => ({
      providerFilters: { ...state.providerFilters, ...filters, page: 1 },
    })),

  setCourierFilters: (filters) =>
    set((state) => ({
      courierFilters: { ...state.courierFilters, ...filters, page: 1 },
    })),

  setOrderFilters: (filters) =>
    set((state) => ({
      orderFilters: { ...state.orderFilters, ...filters, page: 1 },
    })),

  resetUserFilters: () =>
    set(() => ({
      userFilters: defaultFilter,
    })),

  resetProviderFilters: () =>
    set(() => ({
      providerFilters: defaultFilter,
    })),

  resetCourierFilters: () =>
    set(() => ({
      courierFilters: defaultFilter,
    })),

  resetOrderFilters: () =>
    set(() => ({
      orderFilters: defaultFilter,
    })),

  // Selection actions
  toggleUserSelection: (userId) =>
    set((state) => ({
      selectedUsers: state.selectedUsers.includes(userId)
        ? state.selectedUsers.filter((id) => id !== userId)
        : [...state.selectedUsers, userId],
    })),

  toggleProviderSelection: (providerId) =>
    set((state) => ({
      selectedProviders: state.selectedProviders.includes(providerId)
        ? state.selectedProviders.filter((id) => id !== providerId)
        : [...state.selectedProviders, providerId],
    })),

  toggleCourierSelection: (courierId) =>
    set((state) => ({
      selectedCouriers: state.selectedCouriers.includes(courierId)
        ? state.selectedCouriers.filter((id) => id !== courierId)
        : [...state.selectedCouriers, courierId],
    })),

  toggleOrderSelection: (orderId) =>
    set((state) => ({
      selectedOrders: state.selectedOrders.includes(orderId)
        ? state.selectedOrders.filter((id) => id !== orderId)
        : [...state.selectedOrders, orderId],
    })),

  clearUserSelection: () =>
    set(() => ({
      selectedUsers: [],
    })),

  clearProviderSelection: () =>
    set(() => ({
      selectedProviders: [],
    })),

  clearCourierSelection: () =>
    set(() => ({
      selectedCouriers: [],
    })),

  clearOrderSelection: () =>
    set(() => ({
      selectedOrders: [],
    })),

  // Modal actions
  openUserModal: (data) =>
    set(() => ({
      userModal: { isOpen: true, data },
    })),

  closeUserModal: () =>
    set(() => ({
      userModal: { isOpen: false },
    })),

  openProviderModal: (data) =>
    set(() => ({
      providerModal: { isOpen: true, data },
    })),

  closeProviderModal: () =>
    set(() => ({
      providerModal: { isOpen: false },
    })),

  openCourierModal: (data) =>
    set(() => ({
      courierModal: { isOpen: true, data },
    })),

  closeCourierModal: () =>
    set(() => ({
      courierModal: { isOpen: false },
    })),

  openOrderModal: (data) =>
    set(() => ({
      orderModal: { isOpen: true, data },
    })),

  closeOrderModal: () =>
    set(() => ({
      orderModal: { isOpen: false },
    })),

  openActionModal: (title, data) =>
    set(() => ({
      actionModal: { isOpen: true, title, data },
    })),

  closeActionModal: () =>
    set(() => ({
      actionModal: { isOpen: false },
    })),

  // Loading actions
  setLoadingUsers: (loading) =>
    set(() => ({
      isLoadingUsers: loading,
    })),

  setLoadingProviders: (loading) =>
    set(() => ({
      isLoadingProviders: loading,
    })),

  setLoadingCouriers: (loading) =>
    set(() => ({
      isLoadingCouriers: loading,
    })),

  setLoadingOrders: (loading) =>
    set(() => ({
      isLoadingOrders: loading,
    })),

  setLoadingDashboard: (loading) =>
    set(() => ({
      isLoadingDashboard: loading,
    })),

  // Error actions
  setUserError: (error) =>
    set(() => ({
      userError: error,
    })),

  setProviderError: (error) =>
    set(() => ({
      providerError: error,
    })),

  setCourierError: (error) =>
    set(() => ({
      courierError: error,
    })),

  setOrderError: (error) =>
    set(() => ({
      orderError: error,
    })),

  // Reset all
  resetAllStates: () =>
    set(() => ({
      userFilters: defaultFilter,
      providerFilters: defaultFilter,
      courierFilters: defaultFilter,
      orderFilters: defaultFilter,
      selectedUsers: [],
      selectedProviders: [],
      selectedCouriers: [],
      selectedOrders: [],
      userModal: { isOpen: false },
      providerModal: { isOpen: false },
      courierModal: { isOpen: false },
      orderModal: { isOpen: false },
      actionModal: { isOpen: false },
      isLoadingUsers: false,
      isLoadingProviders: false,
      isLoadingCouriers: false,
      isLoadingOrders: false,
      isLoadingDashboard: false,
      userError: null,
      providerError: null,
      courierError: null,
      orderError: null,
    })),
}))
