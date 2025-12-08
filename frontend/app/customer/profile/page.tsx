'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { userAPI, preferencesAPI, type User, type UserPreferences } from '@/lib/api'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { User as UserIcon, Mail, Phone, MapPin, Edit2, Save, X, Package, Leaf, TrendingUp, Crown, Shield, Zap, Calendar } from 'lucide-react'
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
            style={{ borderColor: zamgasTheme.colors.premium.gold, borderTopColor: 'transparent' }}
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
            background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundy} 0%, ${zamgasTheme.colors.premium.burgundyDark} 100%)`,
            border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                  boxShadow: `0 4px 12px ${zamgasTheme.colors.premium.red}40`,
                }}
              >
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ 
                    color: zamgasTheme.colors.premium.gold,
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  {user?.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span 
                    className="px-2 py-0.5 rounded-lg text-xs font-bold capitalize"
                    style={{ 
                      background: `${zamgasTheme.colors.premium.gold}20`,
                      color: zamgasTheme.colors.premium.gold,
                    }}
                  >
                    {user?.user_type}
                  </span>
                </div>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ 
                  background: zamgasTheme.colors.premium.burgundyLight,
                  border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                }}
              >
                <Edit2 className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
              </button>
            )}
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: zamgasTheme.colors.premium.gray }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: `1px solid ${zamgasTheme.colors.premium.gold}30`,
                    color: '#FFFFFF',
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                    color: 'white',
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
                  style={{ 
                    background: zamgasTheme.colors.premium.burgundyLight,
                    border: `1px solid ${zamgasTheme.colors.premium.gray}30`,
                  }}
                >
                  <X className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gray }} />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: zamgasTheme.colors.premium.burgundyLight }}
              >
                <Mail className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                <div>
                  <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>Email</p>
                  <p className="font-medium" style={{ color: '#FFFFFF' }}>{user?.email}</p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: zamgasTheme.colors.premium.burgundyLight }}
              >
                <Phone className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                <div>
                  <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>Phone</p>
                  <p className="font-medium" style={{ color: '#FFFFFF' }}>{user?.phone_number || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Impact Stats */}
        <div>
          <h3
            className="text-lg font-bold mb-4 flex items-center gap-2"
            style={{
              color: zamgasTheme.colors.premium.gold,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            <Leaf className="h-5 w-5" />
            Your Environmental Impact
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Package, label: 'Total Orders', value: stats.totalOrders, color: zamgasTheme.colors.premium.gold },
              { icon: TrendingUp, label: 'CO₂ Saved', value: `${stats.co2Saved}kg`, color: zamgasTheme.colors.semantic.success },
              { icon: Leaf, label: 'Trees Saved', value: stats.treesEquivalent, color: zamgasTheme.colors.semantic.success },
              { icon: Zap, label: 'Money Saved', value: stats.costSavings, color: zamgasTheme.colors.premium.gold },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl"
                  style={{
                    background: zamgasTheme.colors.premium.burgundy,
                    border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
                  }}
                >
                  <Icon className="h-5 w-5 mb-2" style={{ color: stat.color }} />
                  <p
                    className="text-2xl font-bold mb-1"
                    style={{
                      color: '#FFFFFF',
                      fontFamily: zamgasTheme.typography.fontFamily.display,
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>
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
            className="text-lg font-bold mb-4 flex items-center gap-2"
            style={{
              color: zamgasTheme.colors.premium.gold,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            <Shield className="h-5 w-5" />
            Preferences
          </h3>
          <div
            className="p-5 rounded-xl"
            style={{
              background: zamgasTheme.colors.premium.burgundy,
              border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${zamgasTheme.colors.premium.red}30` }}
                >
                  <Zap className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: zamgasTheme.colors.premium.gray }}>
                    Preferred Cylinder
                  </p>
                  <p className="font-bold" style={{ color: '#FFFFFF' }}>
                    {preferences?.preferred_cylinder_type || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${zamgasTheme.colors.premium.gold}20` }}
                >
                  <MapPin className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: zamgasTheme.colors.premium.gray }}>
                    Saved Address
                  </p>
                  <p className="font-medium" style={{ color: '#FFFFFF' }}>
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
            background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.gold}15 0%, ${zamgasTheme.colors.premium.burgundy} 100%)`,
            border: `2px solid ${zamgasTheme.colors.premium.gold}30`,
          }}
        >
          <Calendar className="h-6 w-6 mx-auto mb-2" style={{ color: zamgasTheme.colors.premium.gold }} />
          <p className="text-sm mb-1" style={{ color: zamgasTheme.colors.premium.gray }}>
            Member since
          </p>
          <p className="font-bold text-lg" style={{ color: zamgasTheme.colors.premium.gold }}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
