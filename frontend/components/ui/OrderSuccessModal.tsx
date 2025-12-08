'use client'

import { CheckCircle, Package, MapPin, Clock, X, Zap, Truck } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface OrderSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onViewOrders: () => void
  orderDetails?: {
    orderId?: string
    cylinderType?: string
    quantity?: number
    providerName?: string
    estimatedTime?: string
  }
}

export function OrderSuccessModal({
  isOpen,
  onClose,
  onViewOrders,
  orderDetails,
}: OrderSuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: `${zamgasTheme.colors.premium.burgundyDark}95` }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom duration-500"
        style={{
          background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundy} 0%, ${zamgasTheme.colors.premium.burgundyDark} 100%)`,
          border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
          style={{ background: zamgasTheme.colors.premium.burgundyLight }}
        >
          <X className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gray }} />
        </button>

        {/* Success Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Pulsing circles */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: `${zamgasTheme.colors.premium.gold}30` }}
            />
            <div
              className="absolute inset-[-8px] rounded-full animate-pulse"
              style={{ background: `${zamgasTheme.colors.premium.gold}15` }}
            />
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center animate-in zoom-in duration-500"
              style={{
                background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.gold} 0%, ${zamgasTheme.colors.premium.goldDark || '#D4A600'} 100%)`,
                boxShadow: `0 8px 32px ${zamgasTheme.colors.premium.gold}50`,
              }}
            >
              <CheckCircle className="h-14 w-14 sm:h-16 sm:w-16 animate-in zoom-in duration-700" style={{ color: zamgasTheme.colors.premium.burgundy }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ 
              color: zamgasTheme.colors.premium.gold,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Order Placed! 🔥
          </h2>
          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{ color: zamgasTheme.colors.premium.gray }}
          >
            Your LPG gas is on the way
          </p>
        </div>

        {/* Order Summary Card */}
        {orderDetails && (
          <div
            className="mb-6 p-5 sm:p-6 rounded-2xl space-y-4"
            style={{
              background: zamgasTheme.colors.premium.burgundyLight,
              border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
            }}
          >
            {/* Order ID */}
            {orderDetails.orderId && (
              <div 
                className="text-center pb-4 border-b" 
                style={{ borderColor: `${zamgasTheme.colors.premium.gray}20` }}
              >
                <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Order ID
                </p>
                <p
                  className="text-sm sm:text-base font-mono font-bold mt-1"
                  style={{ color: zamgasTheme.colors.premium.gold }}
                >
                  #{orderDetails.orderId.substring(0, 8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Order Details */}
            <div className="space-y-3">
              {orderDetails.cylinderType && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${zamgasTheme.colors.premium.red}30` }}
                  >
                    <Zap className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                      Cylinder
                    </p>
                    <p className="font-bold" style={{ color: '#FFFFFF' }}>
                      {orderDetails.cylinderType} × {orderDetails.quantity || 1}
                    </p>
                  </div>
                </div>
              )}

              {orderDetails.providerName && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${zamgasTheme.colors.premium.gold}20` }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                      Provider
                    </p>
                    <p className="font-bold" style={{ color: '#FFFFFF' }}>
                      {orderDetails.providerName}
                    </p>
                  </div>
                </div>
              )}

              {orderDetails.estimatedTime && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${zamgasTheme.colors.semantic.info}30` }}
                  >
                    <Clock className="h-5 w-5" style={{ color: zamgasTheme.colors.semantic.info }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                      Estimated Delivery
                    </p>
                    <p className="font-bold" style={{ color: '#FFFFFF' }}>
                      {orderDetails.estimatedTime}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div
          className="mb-6 p-4 rounded-xl"
          style={{ 
            background: zamgasTheme.colors.premium.burgundyLight,
            border: `1px solid ${zamgasTheme.colors.premium.gray}20`,
          }}
        >
          <p
            className="text-sm sm:text-base font-bold mb-3 flex items-center gap-2"
            style={{ color: zamgasTheme.colors.premium.gold }}
          >
            <Truck className="h-4 w-4" />
            What happens next?
          </p>
          <ul className="space-y-2 text-xs sm:text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
            <li className="flex items-start gap-2">
              <span style={{ color: zamgasTheme.colors.semantic.success }}>✓</span>
              <span>Provider will confirm your order shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: zamgasTheme.colors.semantic.success }}>✓</span>
              <span>You'll receive delivery updates via notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: zamgasTheme.colors.semantic.success }}>✓</span>
              <span>Track your order in real-time</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onViewOrders}
            className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 text-base flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
              boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}50`,
            }}
          >
            <MapPin className="h-5 w-5" />
            Track My Order
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 text-sm sm:text-base"
            style={{
              background: zamgasTheme.colors.premium.burgundyLight,
              color: zamgasTheme.colors.premium.gray,
              border: `1px solid ${zamgasTheme.colors.premium.gray}30`,
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
