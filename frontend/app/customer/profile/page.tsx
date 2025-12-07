'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { userAPI, preferencesAPI, type User, type UserPreferences } from '@/lib/api'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { User as UserIcon, Mail, Phone, MapPin, Edit2, Save, X, Package, Leaf, TrendingUp } from 'lucide-react'
import { formatImpactStats } from '@/lib/environmentalImpact'
import { orderAPI, type Order } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone_number: '',
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const [userData, prefsData, ordersData] = await Promise.all([
        userAPI.getProfile(),
        preferencesAPI.get().catch(() => ({ preferences: null })),
        orderAPI.getUserOrders().catch(() => []),
      ])

      setUser(userData)
      setPreferences(prefsData.preferences)
      setOrders(ordersData || [])
      setEditForm({
        name: userData.name,
        phone_number: userData.phone_number || '',
      })
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await userAPI.updateProfile(editForm)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      fetchUserData()
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const stats = formatImpactStats(orders)

  if (isLoading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex justify-center items-center py-12">
          <div
            className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full"
            style={{ borderColor: zamgasTheme.colors.primary.mint, borderTopColor: 'transparent' }}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-6">
        {/* User Info Card */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: zamgasTheme.gradients.primary,
            boxShadow: zamgasTheme.shadows.medium,
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.25)' }}
              >
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2
                  className="text-2xl font-bold text-white mb-1"
                  style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
                >
                  {user?.name}
                </h2>
                <p className="text-white/80 text-sm capitalize">{user?.user_type}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Edit2 className="h-5 w-5 text-white" />
              </button>
            )}
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: zamgasTheme.colors.semantic.textPrimary,
                  }}
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: zamgasTheme.colors.semantic.textPrimary,
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'white',
                    color: zamgasTheme.colors.primary.forest,
                  }}
                >
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      name: user?.name || '',
                      phone_number: user?.phone_number || '',
                    })
                  }}
                  className="px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-white/70" />
                <div>
                  <p className="text-xs text-white/70">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-white/70" />
                <div>
                  <p className="text-xs text-white/70">Phone</p>
                  <p className="text-white font-medium">{user?.phone_number || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Impact Stats */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{
              color: zamgasTheme.colors.semantic.textPrimary,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Your Environmental Impact
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Package, label: 'Total Orders', value: stats.totalOrders, color: zamgasTheme.colors.primary.forest },
              { icon: TrendingUp, label: 'CO₂ Saved', value: `${stats.co2Saved}kg`, color: zamgasTheme.colors.accent.teal },
              { icon: Leaf, label: 'Trees Saved', value: stats.treesEquivalent, color: zamgasTheme.colors.semantic.success },
              { icon: TrendingUp, label: 'Money Saved', value: stats.costSavings, color: zamgasTheme.colors.secondary.amber },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl"
                  style={{
                    background: zamgasTheme.colors.semantic.cardBg,
                    border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                    boxShadow: zamgasTheme.shadows.small,
                  }}
                >
                  <Icon className="h-5 w-5 mb-2" style={{ color: stat.color }} />
                  <p
                    className="text-2xl font-bold mb-1"
                    style={{
                      color: zamgasTheme.colors.semantic.textPrimary,
                      fontFamily: zamgasTheme.typography.fontFamily.display,
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{
              color: zamgasTheme.colors.semantic.textPrimary,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Preferences
          </h3>
          <div
            className="p-5 rounded-xl"
            style={{
              background: zamgasTheme.colors.semantic.cardBg,
              border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
              boxShadow: zamgasTheme.shadows.small,
            }}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                  Preferred Cylinder
                </p>
                <p style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                  {preferences?.preferred_cylinder_type || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: zamgasTheme.colors.semantic.textPrimary }}>
                  Saved Address
                </p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" style={{ color: zamgasTheme.colors.semantic.textSecondary }} />
                  <p style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
                    {preferences?.saved_delivery_address || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div
          className="p-5 rounded-xl text-center"
          style={{
            background: zamgasTheme.colors.primary.mintLight,
            border: `2px solid ${zamgasTheme.colors.primary.mint}`,
          }}
        >
          <p className="text-sm mb-1" style={{ color: zamgasTheme.colors.semantic.textSecondary }}>
            Member since
          </p>
          <p className="font-semibold" style={{ color: zamgasTheme.colors.primary.forestDark }}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
