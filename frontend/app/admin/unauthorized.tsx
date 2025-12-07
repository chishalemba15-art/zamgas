'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access the admin panel. Only administrators can access this area.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Sign In Again
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-6">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  )
}
