'use client'

import { CheckCircle, Package, MapPin, Clock, X } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { Button } from './Button'

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 fade-in zoom-in duration-500"
        style={{
          background: 'white',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Success Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Pulsing circles */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: zamgasTheme.colors.secondary.amber + '40',
              }}
            />
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center animate-in zoom-in duration-500"
              style={{
                background: `linear-gradient(135deg, ${zamgasTheme.colors.secondary.amber} 0%, ${zamgasTheme.colors.secondary.amberLight} 100%)`,
                boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)',
              }}
            >
              <CheckCircle className="h-14 w-14 sm:h-16 sm:w-16 text-white animate-in zoom-in duration-700" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: zamgasTheme.colors.trust.navy }}
          >
            Order Placed Successfully!
          </h2>
          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            Your LPG gas order has been confirmed
          </p>
        </div>

        {/* Order Summary Card */}
        {orderDetails && (
          <div
            className="mb-6 p-5 sm:p-6 rounded-2xl space-y-4"
            style={{
              background: `linear-gradient(135deg, ${zamgasTheme.colors.primary.forest}10 0%, ${zamgasTheme.colors.secondary.amber}10 100%)`,
              border: `2px solid ${zamgasTheme.colors.secondary.amber}40`,
            }}
          >
            {/* Order ID */}
            {orderDetails.orderId && (
              <div className="text-center pb-4 border-b" style={{ borderColor: zamgasTheme.colors.neutral[40] }}>
                <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  Order ID
                </p>
                <p
                  className="text-sm sm:text-base font-mono font-semibold mt-1"
                  style={{ color: zamgasTheme.colors.trust.navy }}
                >
                  {orderDetails.orderId.substring(0, 8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Order Details */}
            <div className="space-y-3">
              {orderDetails.cylinderType && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: zamgasTheme.colors.primary.mintLight }}
                  >
                    <Package className="h-5 w-5" style={{ color: zamgasTheme.colors.primary.forest }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                      Cylinder
                    </p>
                    <p className="font-semibold" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                      {orderDetails.cylinderType} × {orderDetails.quantity || 1}
                    </p>
                  </div>
                </div>
              )}

              {orderDetails.providerName && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: zamgasTheme.colors.secondary.amber + '40' }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: zamgasTheme.colors.primary.forest }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                      Provider
                    </p>
                    <p className="font-semibold" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                      {orderDetails.providerName}
                    </p>
                  </div>
                </div>
              )}

              {orderDetails.estimatedTime && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: zamgasTheme.colors.secondary.amber + '40' }}
                  >
                    <Clock className="h-5 w-5" style={{ color: zamgasTheme.colors.primary.forest }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                      Estimated Delivery
                    </p>
                    <p className="font-semibold" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
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
          style={{ background: zamgasTheme.colors.semantic.cardBg }}
        >
          <p
            className="text-sm sm:text-base font-semibold mb-2"
            style={{ color: zamgasTheme.colors.trust.navy }}
          >
            What happens next?
          </p>
          <ul className="space-y-2 text-xs sm:text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Provider will confirm your order shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>You'll receive delivery updates via notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Track your order in real-time</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onViewOrders}
            className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 text-base"
            style={{
              background: zamgasTheme.gradients.primary,
              boxShadow: zamgasTheme.shadows.medium,
            }}
          >
            Track My Order
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-medium transition-colors text-sm sm:text-base"
            style={{
              background: zamgasTheme.colors.semantic.cardBg,
              color: zamgasTheme.colors.semantic.textSecondary,
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
