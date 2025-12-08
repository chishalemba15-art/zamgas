import { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Zap, MapPin, Star, Navigation, Truck, Minus, Plus, CreditCard, Smartphone } from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'
import { useAuthStore } from '@/lib/authStore'
import { providerAPI, orderAPI, preferencesAPI, nearestProviderAPI, Provider, Order } from '@/lib/api'

// Cylinder sizes and prices
const CYLINDER_SIZES = ['6KG', '9KG', '13KG', '19KG']
const CYLINDER_PRICES: Record<string, number> = {
  '6KG': 85,
  '9KG': 120,
  '13KG': 180,
  '19KG': 290,
}

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdering, setIsOrdering] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  
  // Order form
  const [cylinderType, setCylinderType] = useState('13KG')
  const [quantity, setQuantity] = useState(1)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/signin')
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load providers
      const providersData = await providerAPI.getAll()
      setProviders(providersData || [])
      
      // Select a random provider if none selected
      if (providersData && providersData.length > 0 && !selectedProvider) {
        const randomProvider = providersData[Math.floor(Math.random() * providersData.length)]
        setSelectedProvider(randomProvider)
      }
      
      // Load user orders to check for active order
      try {
        const orders = await orderAPI.getUserOrders()
        const active = orders?.find((o: Order) => ['pending', 'accepted', 'in-transit'].includes(o.status))
        setActiveOrder(active || null)
      } catch {
        // Ignore order errors
      }

      // Load preferences
      try {
        const prefs = await preferencesAPI.get()
        if (prefs?.preferences) {
          if (prefs.preferences.preferred_cylinder_type) {
            setCylinderType(prefs.preferences.preferred_cylinder_type)
          }
          if (prefs.preferences.saved_delivery_address) {
            setDeliveryAddress(prefs.preferences.saved_delivery_address)
          }
        }
      } catch {
        // Ignore preference errors
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedProvider) {
      Alert.alert('Error', 'Please select a provider')
      return
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter your delivery address')
      return
    }
    if (!user) {
      Alert.alert('Error', 'Please sign in first')
      return
    }

    setIsOrdering(true)
    try {
      const order = await orderAPI.create({
        user_id: user.id,
        provider_id: selectedProvider.id,
        cylinder_type: cylinderType,
        quantity,
        delivery_address: deliveryAddress.trim(),
        delivery_method: 'home_delivery',
        payment_method: paymentMethod,
      })

      // Save preferences
      await preferencesAPI.upsert({
        preferred_cylinder_type: cylinderType,
        preferred_provider_id: selectedProvider.id,
        saved_delivery_address: deliveryAddress.trim(),
      }).catch(() => {})

      Alert.alert(
        'Order Placed! 🔥',
        `Your ${cylinderType} gas cylinder is on the way!\n\nOrder #${order.order?.id?.slice(0, 8) || order.id?.slice(0, 8)}`,
        [
          { text: 'View Orders', onPress: () => router.push('/(tabs)/orders') },
          { text: 'OK' },
        ]
      )

      // Refresh to show active order
      loadDashboardData()
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Please try again')
    } finally {
      setIsOrdering(false)
    }
  }

  const totalPrice = CYLINDER_PRICES[cylinderType] * quantity
  const deliveryFee = 20
  const grandTotal = totalPrice + deliveryFee

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={zamgasTheme.colors.premium.gold} />
          <Text style={styles.loadingText}>Loading ZAMGAS...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); loadDashboardData() }}
            tintColor={zamgasTheme.colors.premium.gold}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoIcon}>
              <Zap size={24} color={zamgasTheme.colors.neutral.white} />
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
            </View>
          </View>
        </View>

        {/* Active Order Banner */}
        {activeOrder && (
          <TouchableOpacity 
            style={styles.activeOrderBanner}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={styles.activeOrderIcon}>
              <Truck size={18} color={zamgasTheme.colors.premium.gold} />
            </View>
            <View style={styles.activeOrderInfo}>
              <Text style={styles.activeOrderStatus}>
                {activeOrder.status === 'in-transit' ? '🚚 En Route' : 
                 activeOrder.status === 'accepted' ? '✓ Confirmed' : '⏳ Processing'}
              </Text>
              <Text style={styles.activeOrderId}>Order #{activeOrder.id.slice(0, 6)}</Text>
            </View>
            <Text style={styles.trackText}>Track →</Text>
          </TouchableOpacity>
        )}

        {/* Cylinder Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Cylinder Size</Text>
          <View style={styles.cylinderGrid}>
            {CYLINDER_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.cylinderCard,
                  cylinderType === size && styles.cylinderCardActive,
                ]}
                onPress={() => setCylinderType(size)}
              >
                <Text style={[
                  styles.cylinderSize,
                  cylinderType === size && styles.cylinderSizeActive,
                ]}>
                  {size}
                </Text>
                <Text style={[
                  styles.cylinderPrice,
                  cylinderType === size && styles.cylinderPriceActive,
                ]}>
                  K{CYLINDER_PRICES[size]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Provider Card */}
        {selectedProvider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Provider</Text>
            <View style={styles.providerCard}>
              <View style={styles.providerIcon}>
                <Zap size={24} color={zamgasTheme.colors.premium.gold} />
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{selectedProvider.name}</Text>
                <View style={styles.providerMeta}>
                  {selectedProvider.rating && (
                    <View style={styles.ratingBadge}>
                      <Star size={12} color={zamgasTheme.colors.premium.gold} />
                      <Text style={styles.ratingText}>{selectedProvider.rating}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => quantity > 1 && setQuantity(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus size={20} color={quantity <= 1 ? zamgasTheme.colors.premium.gray : zamgasTheme.colors.premium.gold} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Plus size={20} color={zamgasTheme.colors.premium.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressInputContainer}>
            <MapPin size={20} color={zamgasTheme.colors.premium.gold} />
            <TextInput
              style={styles.addressInput}
              placeholder="Enter your delivery address..."
              placeholderTextColor={zamgasTheme.colors.premium.gray}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('cash')}
            >
              <CreditCard size={20} color={paymentMethod === 'cash' ? zamgasTheme.colors.premium.gold : zamgasTheme.colors.premium.gray} />
              <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextActive]}>
                Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'mobile_money' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('mobile_money')}
            >
              <Smartphone size={20} color={paymentMethod === 'mobile_money' ? zamgasTheme.colors.premium.gold : zamgasTheme.colors.premium.gray} />
              <Text style={[styles.paymentText, paymentMethod === 'mobile_money' && styles.paymentTextActive]}>
                Mobile Money
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{cylinderType} × {quantity}</Text>
            <Text style={styles.summaryValue}>K{totalPrice}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>K{deliveryFee}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>K{grandTotal}</Text>
          </View>
        </View>

        {/* Place Order Button */}
        <TouchableOpacity 
          style={[styles.orderButton, isOrdering && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isOrdering}
        >
          {isOrdering ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Zap size={20} color="white" />
              <Text style={styles.orderButtonText}>Place Order</Text>
            </>
          )}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: zamgasTheme.spacing.base,
    paddingTop: zamgasTheme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: zamgasTheme.colors.premium.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
  },
  userName: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  activeOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    marginHorizontal: zamgasTheme.spacing.base,
    marginBottom: zamgasTheme.spacing.md,
    padding: zamgasTheme.spacing.md,
    borderRadius: zamgasTheme.borderRadius.xl,
    borderLeftWidth: 3,
    borderLeftColor: zamgasTheme.colors.premium.gold,
  },
  activeOrderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${zamgasTheme.colors.premium.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOrderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activeOrderStatus: {
    color: zamgasTheme.colors.premium.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  activeOrderId: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 11,
    marginTop: 2,
  },
  trackText: {
    color: zamgasTheme.colors.premium.gold,
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    padding: zamgasTheme.spacing.base,
    paddingTop: 0,
  },
  sectionTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  cylinderGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  cylinderCard: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  cylinderCardActive: {
    backgroundColor: zamgasTheme.colors.premium.red,
    borderColor: zamgasTheme.colors.premium.gold,
    borderWidth: 2,
  },
  cylinderSize: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 16,
    fontWeight: '700',
  },
  cylinderSizeActive: {
    color: zamgasTheme.colors.premium.gold,
  },
  cylinderPrice: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
    marginTop: 4,
  },
  cylinderPriceActive: {
    color: zamgasTheme.colors.neutral.white,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${zamgasTheme.colors.premium.red}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 16,
    fontWeight: '700',
  },
  providerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: zamgasTheme.colors.premium.burgundy,
    fontSize: 11,
    fontWeight: '700',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.md,
    gap: 24,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 24,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  addressInput: {
    flex: 1,
    color: zamgasTheme.colors.neutral.white,
    fontSize: 14,
    marginLeft: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  paymentOptionActive: {
    borderColor: zamgasTheme.colors.premium.gold,
    backgroundColor: `${zamgasTheme.colors.premium.gold}10`,
  },
  paymentText: {
    color: zamgasTheme.colors.premium.gray,
    fontWeight: '600',
  },
  paymentTextActive: {
    color: zamgasTheme.colors.premium.gold,
  },
  summaryCard: {
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    marginHorizontal: zamgasTheme.spacing.base,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    marginTop: zamgasTheme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
  },
  summaryValue: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    marginVertical: 8,
  },
  totalLabel: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: zamgasTheme.colors.premium.red,
    marginHorizontal: zamgasTheme.spacing.base,
    marginTop: zamgasTheme.spacing.lg,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    height: 56,
    gap: 8,
    ...zamgasTheme.shadows.medium,
  },
  orderButtonDisabled: {
    opacity: 0.7,
  },
  orderButtonText: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 18,
    fontWeight: '700',
  },
})
