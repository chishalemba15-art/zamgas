'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Loader, Phone, Smartphone } from 'lucide-react'
import { zamgasTheme } from '@/lib/zamgas-theme'

interface PaymentStatusModalProps {
  isOpen: boolean
  depositId: string
  onClose: () => void
  onSuccess: () => void
  onFailure: (error: string) => void
}

export function PaymentStatusModal({ isOpen, depositId, onClose, onSuccess, onFailure }: PaymentStatusModalProps) {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  const [errorMessage, setErrorMessage] = useState('')
  const [pollingCount, setPollingCount] = useState(0)

  // Environment detection - check if in sandbox mode
  const isSandbox = process.env.NEXT_PUBLIC_ENVIRONMENT === 'sandbox' || 
                    process.env.NEXT_PUBLIC_PAWAPAY_MODE === 'sandbox'
  
  // Adjust polling based on environment
  const POLLING_INTERVAL = isSandbox ? 3000 : 2000  // 3s for sandbox, 2s for production
  const POLLING_TIMEOUT = isSandbox ? 180000 : 120000  // 3min for sandbox, 2min for production

  useEffect(() => {
    if (!isOpen || !depositId) return

    const pollPaymentStatus = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://zamgas-alb-934347338.us-east-1.elb.amazonaws.com'
        const response = await fetch(`${API_URL}/payments/status/${depositId}`)
        const rawData = await response.json()
        
        // Backend returns wrapped response: { status: { status: "COMPLETED", ... } }
        // We need to unwrap it to get the actual status data
        const data = rawData.status && typeof rawData.status === 'object' ? rawData.status : rawData

        // Status handling based on PawaPay payment lifecycle:
        // ACCEPTED = Payment processing (waiting for user PIN entry)
        // COMPLETED = Payment successful (final)
        // FAILED/REJECTED = Payment failed (final)
        //
        // Sandbox Test Numbers for Zambia (AIRTEL_OAPI_ZMB):
        // SUCCESS: 260973456789 → COMPLETED
        // FAIL: 260973456039 → PAYMENT_NOT_APPROVED
        // FAIL: 260973456049 → INSUFFICIENT_BALANCE
        // FAIL: 260973456069 → UNSPECIFIED_FAILURE
        
        console.log('Payment Status Check:', data.status, data)

        if (data.status === 'COMPLETED') {
          setStatus('success')
          setTimeout(() => {
            onSuccess()
          }, 2000) // Show success for 2 seconds before closing
        } else if (data.status === 'FAILED' || data.status === 'REJECTED') {
          setStatus('failed')
          setErrorMessage(data.failureReason?.failureMessage || data.rejectionReason?.rejectionMessage || 'Payment failed')
          onFailure(errorMessage)
        }
        // If ACCEPTED or SUBMITTED, continue polling (payment still processing)
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }

    // Poll based on environment configuration
    const interval = setInterval(() => {
      setPollingCount(prev => prev + 1)
      pollPaymentStatus()
    }, POLLING_INTERVAL)

    // Stop polling after configured timeout
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (status === 'pending') {
        setStatus('failed')
        setErrorMessage(isSandbox 
          ? 'Sandbox payment timeout - payments may take longer in sandbox mode' 
          : 'Payment timeout - please check your phone')
        onFailure('timeout')
      }
    }, POLLING_TIMEOUT)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isOpen, depositId, status])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div
        className="relative w-full max-w-md p-6 rounded-2xl animate-fade-in"
        style={{
          background: zamgasTheme.colors.semantic.cardBg,
          boxShadow: zamgasTheme.shadows.large,
        }}
      >
        {/* Close button */}
        {status !== 'pending' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-opacity-10"
            style={{ background: zamgasTheme.colors.neutral[200] }}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content based on status */}
        <div className="text-center">
          {status === 'pending' && (
            <>
              <div className="mb-6">
                <div className="relative inline-block">
                  <Smartphone className="h-20 w-20 mx-auto mb-4" style={{ color: zamgasTheme.colors.primary.forest }} />
                  <div className="absolute -top-2 -right-2">
                    <div className="animate-spin">
                      <Loader className="h-8 w-8" style={{ color: zamgasTheme.colors.accent.teal }} />
                    </div>
                  </div>
                </div>
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{
                  color: zamgasTheme.colors.semantic.textPrimary,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}
              >
                Waiting for Payment
              </h3>
              
              {/* Sandbox mode badge */}
              {isSandbox && (
                <div 
                  className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ 
                    background: zamgasTheme.colors.accent.cyan + '20',
                    color: zamgasTheme.colors.accent.cyan,
                    border: `1px solid ${zamgasTheme.colors.accent.cyan}40`
                  }}
                >
                  🧪 SANDBOX MODE
                </div>
              )}
              
              <p className="text-sm mb-6" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                {isSandbox 
                  ? 'Test payment - Check your phone for a payment prompt (sandbox payments may take longer)'
                  : 'Check your phone for a payment prompt'}
              </p>

              {/* Steps */}
              <div className="text-left space-y-3 mb-6">
                {[
                  { step: 1, text: 'USSD prompt sent to your phone' },
                  { step: 2, text: 'Enter your PIN to confirm' },
                  { step: 3, text: 'Wait for confirmation' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: zamgasTheme.colors.primary.mint + '30',
                        color: zamgasTheme.colors.primary.forest,
                      }}
                    >
                      {item.step}
                    </div>
                    <span className="text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Loading animation */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                      background: zamgasTheme.colors.primary.forest,
                      animationDelay: `${i * 200}ms`,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6">
                <div
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 animate-scale-in"
                  style={{ background: zamgasTheme.colors.semantic.success + '20' }}
                >
                  <CheckCircle className="h-12 w-12" style={{ color: zamgasTheme.colors.semantic.success }} />
                </div>
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{
                  color: zamgasTheme.colors.semantic.success,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}
              >
                Payment Successful!
              </h3>
              <p className="text-sm" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                Your order has been placed successfully
              </p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mb-6">
                <div
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{ background: zamgasTheme.colors.semantic.danger + '20' }}
                >
                  <AlertCircle className="h-12 w-12" style={{ color: zamgasTheme.colors.semantic.danger }} />
                </div>
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{
                  color: zamgasTheme.colors.semantic.danger,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}
              >
                Payment Failed
              </h3>
              <p className="text-sm mb-4" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                {errorMessage || 'Something went wrong with your payment'}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: zamgasTheme.gradients.primary,
                  color: 'white',
                  boxShadow: zamgasTheme.shadows.medium,
                }}
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}
