'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Loader, Smartphone, Zap } from 'lucide-react'
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
  const POLLING_INTERVAL = isSandbox ? 3000 : 2000
  const POLLING_TIMEOUT = isSandbox ? 180000 : 120000

  useEffect(() => {
    if (!isOpen || !depositId) return

    const pollPaymentStatus = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zamgas-production.up.railway.app'
        const response = await fetch(`${API_URL}/payments/status/${depositId}`)
        const rawData = await response.json()
        
        const data = rawData.status && typeof rawData.status === 'object' ? rawData.status : rawData

        console.log('Payment Status Check:', data.status, data)

        if (data.status === 'COMPLETED') {
          setStatus('success')
          setTimeout(() => {
            onSuccess()
          }, 2000)
        } else if (data.status === 'FAILED' || data.status === 'REJECTED') {
          setStatus('failed')
          setErrorMessage(data.failureReason?.failureMessage || data.rejectionReason?.rejectionMessage || 'Payment failed')
          onFailure(errorMessage)
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }

    const interval = setInterval(() => {
      setPollingCount(prev => prev + 1)
      pollPaymentStatus()
    }, POLLING_INTERVAL)

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" 
      style={{ background: `${zamgasTheme.colors.premium.burgundyDark}95` }}
    >
      <div
        className="relative w-full max-w-md p-6 rounded-2xl animate-fade-in"
        style={{
          background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundy} 0%, ${zamgasTheme.colors.premium.burgundyDark} 100%)`,
          border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Close button */}
        {status !== 'pending' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110"
            style={{ background: zamgasTheme.colors.premium.burgundyLight }}
          >
            <X className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gray }} />
          </button>
        )}

        {/* Content based on status */}
        <div className="text-center">
          {status === 'pending' && (
            <>
              <div className="mb-6">
                <div className="relative inline-block">
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.gold}30 0%, ${zamgasTheme.colors.premium.burgundyLight} 100%)`,
                      border: `2px solid ${zamgasTheme.colors.premium.gold}40`,
                    }}
                  >
                    <Smartphone className="h-10 w-10" style={{ color: zamgasTheme.colors.premium.gold }} />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <div className="animate-spin">
                      <Loader className="h-7 w-7" style={{ color: zamgasTheme.colors.premium.gold }} />
                    </div>
                  </div>
                </div>
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{
                  color: zamgasTheme.colors.premium.gold,
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
                    background: `${zamgasTheme.colors.semantic.info}20`,
                    color: zamgasTheme.colors.semantic.info,
                    border: `1px solid ${zamgasTheme.colors.semantic.info}40`
                  }}
                >
                  🧪 SANDBOX MODE
                </div>
              )}
              
              <p className="text-sm mb-6" style={{ color: zamgasTheme.colors.premium.gray }}>
                {isSandbox 
                  ? 'Test payment - Check your phone for a payment prompt'
                  : 'Check your phone for a payment prompt'}
              </p>

              {/* Steps */}
              <div 
                className="text-left space-y-3 mb-6 p-4 rounded-xl"
                style={{ background: zamgasTheme.colors.premium.burgundyLight }}
              >
                {[
                  { step: 1, text: 'USSD prompt sent to your phone', icon: '📱' },
                  { step: 2, text: 'Enter your PIN to confirm', icon: '🔐' },
                  { step: 3, text: 'Wait for confirmation', icon: '✨' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{
                        background: `${zamgasTheme.colors.premium.gold}20`,
                      }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
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
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{
                      background: zamgasTheme.colors.premium.gold,
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
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 animate-scale-in"
                  style={{ 
                    background: `${zamgasTheme.colors.semantic.success}20`,
                    boxShadow: `0 0 40px ${zamgasTheme.colors.semantic.success}30`,
                  }}
                >
                  <CheckCircle className="h-14 w-14" style={{ color: zamgasTheme.colors.semantic.success }} />
                </div>
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{
                  color: zamgasTheme.colors.semantic.success,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}
              >
                Payment Successful! 🎉
              </h3>
              <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                Your order has been placed successfully
              </p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mb-6">
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{ 
                    background: `${zamgasTheme.colors.semantic.danger}20`,
                    boxShadow: `0 0 40px ${zamgasTheme.colors.semantic.danger}20`,
                  }}
                >
                  <AlertCircle className="h-14 w-14" style={{ color: zamgasTheme.colors.semantic.danger }} />
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
              <p className="text-sm mb-6" style={{ color: zamgasTheme.colors.premium.gray }}>
                {errorMessage || 'Something went wrong with your payment'}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                  color: 'white',
                  boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}40`,
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
