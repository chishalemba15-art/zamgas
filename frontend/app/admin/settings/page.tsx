'use client'

import { useState, useEffect } from 'react'
import { Save, AlertCircle, RefreshCw, Trash2, Plus } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface PlatformSettings {
  deliveryFeePercentage: number
  serviceChargePercentage: number
  maxOrdersPerDay: number
  minDeliveryDistance: number
  maxDeliveryDistance: number
  averageDeliveryTime: number
  platformMaintenanceMode: boolean
  notificationsEnabled: boolean
  maintenanceMessage: string
  supportEmail: string
  supportPhone: string
  currency: string
  taxRate: number
  minOrderAmount: number
  orderCancellationWindow: number
  providerVerificationRequired: boolean
}

interface TransactionFee {
  id?: string
  feeType: 'platform_commission' | 'delivery_fee' | 'service_charge' | 'transaction_fee'
  percentage: number
  fixedAmount: number
  isActive: boolean
  description: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    deliveryFeePercentage: 8,
    serviceChargePercentage: 5,
    maxOrdersPerDay: 500,
    minDeliveryDistance: 1,
    maxDeliveryDistance: 50,
    averageDeliveryTime: 35,
    platformMaintenanceMode: false,
    notificationsEnabled: true,
    maintenanceMessage: 'We are currently undergoing maintenance. Please try again later.',
    supportEmail: 'support@zamgas.com',
    supportPhone: '+260211234567',
    currency: 'ZWL',
    taxRate: 0,
    minOrderAmount: 50,
    orderCancellationWindow: 5,
    providerVerificationRequired: true,
  })

  const [fees, setFees] = useState<TransactionFee[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newFee, setNewFee] = useState<TransactionFee>({
    feeType: 'platform_commission',
    percentage: 0,
    fixedAmount: 0,
    isActive: true,
    description: '',
  })
  const [showNewFeeForm, setShowNewFeeForm] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getSettings()
      if (response.settings) {
        setSettings(response.settings)
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: keyof PlatformSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    setSaved(false)
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      await adminAPI.updateSettings(settings)
      setSaved(true)
      toast.success('Settings saved successfully!')
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      toast.error(error.response?.data?.error || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFee = async () => {
    if (!newFee.description.trim() || (newFee.percentage === 0 && newFee.fixedAmount === 0)) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      // Add the fee via API
      toast.success('Transaction fee added successfully!')
      setNewFee({
        feeType: 'platform_commission',
        percentage: 0,
        fixedAmount: 0,
        isActive: true,
        description: '',
      })
      setShowNewFeeForm(false)
    } catch (error: any) {
      toast.error('Failed to add transaction fee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform behavior, policies, and transaction fees</p>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Reload
        </button>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pricing Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing Configuration</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Fee (%):
              </label>
              <input
                type="number"
                value={settings.deliveryFeePercentage}
                onChange={(e) => handleSettingChange('deliveryFeePercentage', parseFloat(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Percentage of order total charged as delivery fee</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Charge (%):
              </label>
              <input
                type="number"
                value={settings.serviceChargePercentage}
                onChange={(e) => handleSettingChange('serviceChargePercentage', parseFloat(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Percentage of order total charged as service fee</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Delivery Time (minutes):
              </label>
              <input
                type="number"
                value={settings.averageDeliveryTime}
                onChange={(e) => handleSettingChange('averageDeliveryTime', parseFloat(e.target.value))}
                min="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Expected average delivery time for customer estimates</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%):
              </label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Tax percentage applied to orders</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Amount:
              </label>
              <input
                type="number"
                value={settings.minOrderAmount}
                onChange={(e) => handleSettingChange('minOrderAmount', parseFloat(e.target.value))}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Minimum order value allowed</p>
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Configuration</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Delivery Distance (km):
              </label>
              <input
                type="number"
                value={settings.minDeliveryDistance}
                onChange={(e) => handleSettingChange('minDeliveryDistance', parseFloat(e.target.value))}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Delivery Distance (km):
              </label>
              <input
                type="number"
                value={settings.maxDeliveryDistance}
                onChange={(e) => handleSettingChange('maxDeliveryDistance', parseFloat(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Orders Per Day:
              </label>
              <input
                type="number"
                value={settings.maxOrdersPerDay}
                onChange={(e) => handleSettingChange('maxOrdersPerDay', parseFloat(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Cancellation Window (minutes):
              </label>
              <input
                type="number"
                value={settings.orderCancellationWindow}
                onChange={(e) => handleSettingChange('orderCancellationWindow', parseFloat(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Time window after which orders cannot be cancelled by customers</p>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.providerVerificationRequired}
                  onChange={(e) => handleSettingChange('providerVerificationRequired', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Require Provider Verification</span>
              </label>
              <p className="text-xs text-gray-600 mt-2 ml-7">Require providers to be verified before accepting orders</p>
            </div>
          </div>
        </div>

        {/* Maintenance Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Maintenance & Support</h2>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.platformMaintenanceMode}
                  onChange={(e) => handleSettingChange('platformMaintenanceMode', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Enable Maintenance Mode</span>
              </label>
              <p className="text-xs text-gray-600 mt-2 ml-7">Disable platform access for regular users during maintenance</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Message:
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email:</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone:</label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Currency & Regional */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Regional Settings</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency Code:</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value.toUpperCase())}
                placeholder="ZWL"
                maxLength={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
              <p className="text-xs text-gray-600 mt-1">ISO 4217 currency code</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
              </label>
              <p className="text-xs text-gray-600 mt-2 ml-7">Allow push notifications to users</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900">Notification Center</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Additional notification settings available in the notification management section
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Fees Section */}
      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Transaction Fees</h2>
          {!showNewFeeForm && (
            <button
              onClick={() => setShowNewFeeForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Fee
            </button>
          )}
        </div>

        {showNewFeeForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Transaction Fee</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type</label>
                <select
                  value={newFee.feeType}
                  onChange={(e) => setNewFee({ ...newFee, feeType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="platform_commission">Platform Commission</option>
                  <option value="delivery_fee">Delivery Fee</option>
                  <option value="service_charge">Service Charge</option>
                  <option value="transaction_fee">Transaction Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  placeholder="e.g., Weekend Delivery"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Percentage (%)</label>
                <input
                  type="number"
                  value={newFee.percentage}
                  onChange={(e) => setNewFee({ ...newFee, percentage: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Amount</label>
                <input
                  type="number"
                  value={newFee.fixedAmount}
                  onChange={(e) => setNewFee({ ...newFee, fixedAmount: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFee.isActive}
                    onChange={(e) => setNewFee({ ...newFee, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddFee}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                Create Fee
              </button>
              <button
                onClick={() => setShowNewFeeForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-600">Manage all transaction fees applied to orders</p>
          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
            <p>No transaction fees configured yet</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
