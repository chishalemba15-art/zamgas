import { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { User, Mail, Phone, MapPin, Edit2, Save, X, Package, Leaf, LogOut, Calendar, Zap } from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'
import { useAuthStore } from '@/lib/authStore'
import { userAPI, preferencesAPI, orderAPI, User as UserType, UserPreferences, Order } from '@/lib/api'

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone_number: '',
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      const [prefsResponse, ordersResponse] = await Promise.all([
        preferencesAPI.get().catch(() => ({ preferences: null })),
        orderAPI.getUserOrders().catch(() => []),
      ])
      
      setPreferences(prefsResponse?.preferences || null)
      setOrders(ordersResponse || [])
      setEditForm({
        name: user?.name || '',
        phone_number: user?.phone_number || '',
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await userAPI.updateProfile(editForm)
      updateUser(editForm)
      setIsEditing(false)
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile')
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout()
            router.replace('/(auth)/signin')
          }
        },
      ]
    )
  }

  // Calculate stats
  const totalOrders = orders.length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const co2Saved = deliveredOrders * 12 // Approximate kg CO2 saved per order

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={zamgasTheme.colors.premium.gold} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userCardHeader}>
            <View style={styles.avatarContainer}>
              <User size={32} color={zamgasTheme.colors.neutral.white} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.userTypeBadge}>
                <Text style={styles.userTypeText}>Customer</Text>
              </View>
            </View>
            {!isEditing && (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Edit2 size={18} color={zamgasTheme.colors.premium.gold} />
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                placeholder="Name"
                placeholderTextColor={zamgasTheme.colors.premium.gray}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              />
              <TextInput
                style={styles.editInput}
                placeholder="Phone Number"
                placeholderTextColor={zamgasTheme.colors.premium.gray}
                value={editForm.phone_number}
                onChangeText={(text) => setEditForm({ ...editForm, phone_number: text })}
                keyboardType="phone-pad"
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Save size={18} color={zamgasTheme.colors.neutral.white} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                  <X size={18} color={zamgasTheme.colors.premium.gray} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.contactInfo}>
              <View style={styles.infoRow}>
                <Mail size={18} color={zamgasTheme.colors.premium.gold} />
                <View>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Phone size={18} color={zamgasTheme.colors.premium.gold} />
                <View>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user?.phone_number || 'Not set'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            {[
              { icon: Package, label: 'Total Orders', value: totalOrders, color: zamgasTheme.colors.premium.gold },
              { icon: Leaf, label: 'CO₂ Saved', value: `${co2Saved}kg`, color: zamgasTheme.colors.semantic.success },
            ].map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <stat.icon size={20} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.prefsCard}>
            <View style={styles.prefRow}>
              <Zap size={18} color={zamgasTheme.colors.premium.gold} />
              <View style={styles.prefInfo}>
                <Text style={styles.prefLabel}>Preferred Cylinder</Text>
                <Text style={styles.prefValue}>{preferences?.preferred_cylinder_type || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.prefRow}>
              <MapPin size={18} color={zamgasTheme.colors.premium.gold} />
              <View style={styles.prefInfo}>
                <Text style={styles.prefLabel}>Saved Address</Text>
                <Text style={styles.prefValue} numberOfLines={2}>
                  {preferences?.saved_delivery_address || 'Not set'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Member Since */}
        <View style={styles.memberCard}>
          <Calendar size={20} color={zamgasTheme.colors.premium.gold} />
          <Text style={styles.memberLabel}>Member since</Text>
          <Text style={styles.memberValue}>
            {user?.created_at 
              ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : 'N/A'
            }
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={zamgasTheme.colors.semantic.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: zamgasTheme.spacing.base,
  },
  userCard: {
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius['2xl'],
    padding: zamgasTheme.spacing.lg,
    marginBottom: zamgasTheme.spacing.lg,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: zamgasTheme.spacing.lg,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: zamgasTheme.colors.premium.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  userTypeBadge: {
    backgroundColor: `${zamgasTheme.colors.premium.gold}20`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  userTypeText: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    padding: 12,
    borderRadius: 12,
  },
  infoLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 11,
  },
  infoValue: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 14,
    fontWeight: '500',
  },
  editForm: {
    gap: 12,
  },
  editInput: {
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    borderRadius: 12,
    padding: 14,
    color: zamgasTheme.colors.neutral.white,
    fontSize: 15,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: 12,
    padding: 14,
  },
  saveButtonText: {
    color: zamgasTheme.colors.neutral.white,
    fontWeight: '700',
  },
  cancelButton: {
    width: 48,
    borderRadius: 12,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: zamgasTheme.spacing.lg,
  },
  sectionTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
    marginTop: 4,
  },
  prefsCard: {
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    gap: 14,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  prefInfo: {
    flex: 1,
  },
  prefLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
  },
  prefValue: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  memberCard: {
    backgroundColor: `${zamgasTheme.colors.premium.gold}10`,
    borderRadius: zamgasTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: `${zamgasTheme.colors.premium.gold}30`,
    padding: zamgasTheme.spacing.lg,
    alignItems: 'center',
    marginBottom: zamgasTheme.spacing.lg,
  },
  memberLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
    marginTop: 8,
  },
  memberValue: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: `${zamgasTheme.colors.semantic.danger}15`,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    borderWidth: 1,
    borderColor: `${zamgasTheme.colors.semantic.danger}30`,
  },
  logoutText: {
    color: zamgasTheme.colors.semantic.danger,
    fontSize: 15,
    fontWeight: '600',
  },
})
