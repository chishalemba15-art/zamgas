import { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Animated,
  Image,
  ScrollView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { 
  Zap, 
  MapPin, 
  Star, 
  Minus, 
  Plus, 
  ChevronUp,
  ChevronDown,
  Truck,
  CheckCircle,
  Package,
  Navigation,
} from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'
import { useAuthStore } from '@/lib/authStore'
import { providerAPI, orderAPI, preferencesAPI, nearestProviderAPI, Provider, Order } from '@/lib/api'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const MAP_HEIGHT = SCREEN_HEIGHT * 0.42
const BOTTOM_SHEET_MIN = SCREEN_HEIGHT * 0.58
const BOTTOM_SHEET_MAX = SCREEN_HEIGHT * 0.85

// Cylinder sizes and prices
const CYLINDER_SIZES = [
  { size: '6KG', price: 85, emoji: '🔥' },
  { size: '9KG', price: 120, emoji: '🔥' },
  { size: '13KG', price: 180, emoji: '⚡' },
  { size: '19KG', price: 290, emoji: '💪' },
]

// Payment methods with logos
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: '💵' },
  { id: 'mtn', name: 'MTN MoMo', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg' },
  { id: 'airtel', name: 'Airtel Money', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Airtel_Africa_logo.svg' },
  { id: 'zamtel', name: 'Zamtel Kwacha', logo: null, color: '#00A651' },
]

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdering, setIsOrdering] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastOrderId, setLastOrderId] = useState('')
  
  // Map & Provider
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const mapRef = useRef<MapView>(null)
  
  // Bottom Sheet
  const [isExpanded, setIsExpanded] = useState(false)
  const bottomSheetAnim = useRef(new Animated.Value(0)).current
  
  // Order form
  const [selectedCylinder, setSelectedCylinder] = useState(CYLINDER_SIZES[2]) // Default 13KG
  const [quantity, setQuantity] = useState(1)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Default location (Lusaka)
  const [region, setRegion] = useState({
    latitude: -15.4167,
    longitude: 28.2833,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/signin')
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    Animated.spring(bottomSheetAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start()
  }, [isExpanded])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load providers
      const providersData = await providerAPI.getAll()
      setProviders(providersData || [])
      
      // Select nearest or random provider
      if (providersData && providersData.length > 0) {
        const randomProvider = providersData[Math.floor(Math.random() * providersData.length)]
        setSelectedProvider(randomProvider)
        
        // Center map on provider
        if (randomProvider.latitude && randomProvider.longitude) {
          setRegion({
            latitude: randomProvider.latitude,
            longitude: randomProvider.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          })
        }
      }
      
      // Load active orders
      try {
        const orders = await orderAPI.getUserOrders()
        const active = orders?.find((o: Order) => ['pending', 'accepted', 'in-transit'].includes(o.status))
        setActiveOrder(active || null)
      } catch {}

      // Load preferences
      try {
        const prefs = await preferencesAPI.get()
        if (prefs?.preferences) {
          if (prefs.preferences.preferred_cylinder_type) {
            const found = CYLINDER_SIZES.find(c => c.size === prefs.preferences.preferred_cylinder_type)
            if (found) setSelectedCylinder(found)
          }
          if (prefs.preferences.saved_delivery_address) {
            setDeliveryAddress(prefs.preferences.saved_delivery_address)
          }
        }
      } catch {}
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedProvider) {
      Alert.alert('Error', 'No provider available')
      return
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Missing Address', 'Please enter your delivery address')
      return
    }

    setIsOrdering(true)
    try {
      const order = await orderAPI.create({
        provider_id: selectedProvider.id,
        cylinder_type: selectedCylinder.size,
        quantity,
        delivery_address: deliveryAddress.trim(),
        delivery_method: 'home_delivery',
        payment_method: paymentMethod === 'cash' ? 'cash' : 'mobile_money',
      })

      // Save preferences
      await preferencesAPI.upsert({
        preferred_cylinder_type: selectedCylinder.size,
        preferred_provider_id: selectedProvider.id,
        saved_delivery_address: deliveryAddress.trim(),
      }).catch(() => {})

      setLastOrderId(order.order?.id || order.id || '')
      setShowSuccess(true)
      
      // Auto-hide after 4 seconds
      setTimeout(() => {
        setShowSuccess(false)
        loadDashboardData()
      }, 4000)
      
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Please try again')
    } finally {
      setIsOrdering(false)
    }
  }

  const totalPrice = selectedCylinder.price * quantity
  const deliveryFee = 20
  const grandTotal = totalPrice + deliveryFee

  const bottomSheetHeight = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BOTTOM_SHEET_MIN, BOTTOM_SHEET_MAX],
  })

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Zap size={40} color={zamgasTheme.colors.premium.burgundy} />
        </View>
        <Text style={styles.loadingText}>Finding providers...</Text>
        <ActivityIndicator size="small" color={zamgasTheme.colors.premium.gold} style={{ marginTop: 16 }} />
      </View>
    )
  }

  // Success Overlay
  if (showSuccess) {
    return (
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={zamgasTheme.colors.semantic.success} />
          </View>
          <Text style={styles.successTitle}>Order Placed! 🔥</Text>
          <Text style={styles.successSubtitle}>Your gas is on the way</Text>
          
          <View style={styles.successDetails}>
            <View style={styles.successRow}>
              <Package size={18} color={zamgasTheme.colors.premium.gold} />
              <Text style={styles.successText}>{selectedCylinder.size} × {quantity}</Text>
            </View>
            <View style={styles.successRow}>
              <MapPin size={18} color={zamgasTheme.colors.premium.gold} />
              <Text style={styles.successText} numberOfLines={1}>{deliveryAddress}</Text>
            </View>
            <View style={styles.successRow}>
              <Truck size={18} color={zamgasTheme.colors.premium.gold} />
              <Text style={styles.successText}>Est. 30-60 mins</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => {
              setShowSuccess(false)
              router.push('/(tabs)/orders')
            }}
          >
            <Navigation size={18} color="white" />
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Map Section - 40% of screen */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          region={region}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={darkMapStyle}
        >
          {/* Provider Markers */}
          {providers.map((provider) => (
            provider.latitude && provider.longitude && (
              <Marker
                key={provider.id}
                coordinate={{
                  latitude: provider.latitude,
                  longitude: provider.longitude,
                }}
                onPress={() => setSelectedProvider(provider)}
              >
                <View style={[
                  styles.markerContainer,
                  selectedProvider?.id === provider.id && styles.markerSelected
                ]}>
                  <Zap size={16} color={selectedProvider?.id === provider.id ? zamgasTheme.colors.premium.burgundy : 'white'} />
                </View>
              </Marker>
            )
          ))}
        </MapView>

        {/* Map Overlay - Provider Card */}
        <SafeAreaView style={styles.mapOverlay} edges={['top']}>
          <View style={styles.mapHeader}>
            <View style={styles.logoSmall}>
              <Zap size={20} color={zamgasTheme.colors.premium.burgundy} />
            </View>
            <View>
              <Text style={styles.welcomeText}>Hi, {user?.name?.split(' ')[0]} 👋</Text>
              <Text style={styles.taglineText}>Order LPG in 60 seconds</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Active Order Banner */}
        {activeOrder && (
          <TouchableOpacity 
            style={styles.activeOrderBanner}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={styles.activeOrderPulse} />
            <Truck size={18} color={zamgasTheme.colors.premium.gold} />
            <Text style={styles.activeOrderText}>
              {activeOrder.status === 'in-transit' ? '🚚 En Route' : '⏳ Processing'}
            </Text>
            <Text style={styles.activeOrderLink}>Track →</Text>
          </TouchableOpacity>
        )}

        {/* Selected Provider Info */}
        {selectedProvider && (
          <View style={styles.providerChip}>
            <View style={styles.providerChipIcon}>
              <Zap size={14} color={zamgasTheme.colors.premium.gold} />
            </View>
            <Text style={styles.providerChipName}>{selectedProvider.name}</Text>
            {selectedProvider.rating && (
              <View style={styles.ratingChip}>
                <Star size={10} color={zamgasTheme.colors.premium.gold} fill={zamgasTheme.colors.premium.gold} />
                <Text style={styles.ratingText}>{selectedProvider.rating}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: bottomSheetHeight }]}>
        {/* Handle */}
        <TouchableOpacity 
          style={styles.sheetHandle}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.handleBar} />
          {isExpanded ? (
            <ChevronDown size={20} color={zamgasTheme.colors.premium.gray} />
          ) : (
            <ChevronUp size={20} color={zamgasTheme.colors.premium.gray} />
          )}
        </TouchableOpacity>

        <ScrollView 
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Quick Cylinder Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Cylinder</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.cylinderRow}>
                {CYLINDER_SIZES.map((cyl) => (
                  <TouchableOpacity
                    key={cyl.size}
                    style={[
                      styles.cylinderPill,
                      selectedCylinder.size === cyl.size && styles.cylinderPillActive,
                    ]}
                    onPress={() => setSelectedCylinder(cyl)}
                  >
                    <Text style={styles.cylinderEmoji}>{cyl.emoji}</Text>
                    <Text style={[
                      styles.cylinderSize,
                      selectedCylinder.size === cyl.size && styles.cylinderSizeActive,
                    ]}>
                      {cyl.size}
                    </Text>
                    <Text style={[
                      styles.cylinderPrice,
                      selectedCylinder.size === cyl.size && styles.cylinderPriceActive,
                    ]}>
                      K{cyl.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity 
                style={styles.qtyButton}
                onPress={() => quantity > 1 && setQuantity(quantity - 1)}
              >
                <Minus size={20} color={quantity <= 1 ? zamgasTheme.colors.premium.gray : 'white'} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.qtyButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressInput}>
              <MapPin size={18} color={zamgasTheme.colors.premium.gold} />
              <TextInput
                style={styles.addressText}
                placeholder="Enter delivery address..."
                placeholderTextColor={zamgasTheme.colors.premium.gray}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentCard,
                    paymentMethod === method.id && styles.paymentCardActive,
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  {method.icon ? (
                    <Text style={styles.paymentIcon}>{method.icon}</Text>
                  ) : method.logo ? (
                    <Image source={{ uri: method.logo }} style={styles.paymentLogo} />
                  ) : (
                    <View style={[styles.paymentLogoPlaceholder, { backgroundColor: method.color }]}>
                      <Text style={styles.paymentLogoText}>{method.name[0]}</Text>
                    </View>
                  )}
                  <Text style={[
                    styles.paymentName,
                    paymentMethod === method.id && styles.paymentNameActive,
                  ]}>
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Order Summary & Button */}
          <View style={styles.orderSection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{selectedCylinder.size} × {quantity}</Text>
              <Text style={styles.summaryValue}>K{totalPrice}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>K{deliveryFee}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>K{grandTotal}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.orderButton, isOrdering && styles.orderButtonDisabled]}
              onPress={handlePlaceOrder}
              disabled={isOrdering}
            >
              {isOrdering ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Zap size={20} color="white" fill="white" />
                  <Text style={styles.orderButtonText}>Place Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  )
}

// Dark map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8c8c8c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: zamgasTheme.colors.premium.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },

  // Map
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  logoSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: zamgasTheme.colors.premium.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  taglineText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: zamgasTheme.colors.premium.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  markerSelected: {
    backgroundColor: zamgasTheme.colors.premium.gold,
    transform: [{ scale: 1.2 }],
  },
  activeOrderBanner: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: zamgasTheme.colors.premium.gold,
  },
  activeOrderPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: zamgasTheme.colors.semantic.success,
  },
  activeOrderText: {
    flex: 1,
    color: 'white',
    fontWeight: '600',
  },
  activeOrderLink: {
    color: zamgasTheme.colors.premium.gold,
    fontWeight: '600',
  },
  providerChip: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  providerChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${zamgasTheme.colors.premium.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerChipName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: zamgasTheme.colors.premium.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: zamgasTheme.colors.premium.burgundy,
    fontSize: 11,
    fontWeight: '700',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    marginBottom: 4,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  
  // Cylinders
  cylinderRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  cylinderPill: {
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
    minWidth: 80,
  },
  cylinderPillActive: {
    backgroundColor: zamgasTheme.colors.premium.red,
    borderColor: zamgasTheme.colors.premium.gold,
    borderWidth: 2,
  },
  cylinderEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  cylinderSize: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cylinderSizeActive: {
    color: zamgasTheme.colors.premium.gold,
  },
  cylinderPrice: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
    marginTop: 2,
  },
  cylinderPriceActive: {
    color: 'white',
  },

  // Quantity
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  qtyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
  },

  // Address
  addressInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  addressText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    minHeight: 40,
  },

  // Payment
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  paymentCardActive: {
    borderColor: zamgasTheme.colors.premium.gold,
    backgroundColor: `${zamgasTheme.colors.premium.gold}10`,
  },
  paymentIcon: {
    fontSize: 24,
  },
  paymentLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    resizeMode: 'contain',
  },
  paymentLogoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentLogoText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  paymentName: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 13,
    fontWeight: '500',
  },
  paymentNameActive: {
    color: zamgasTheme.colors.premium.gold,
  },

  // Order Summary
  orderSection: {
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
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
    color: 'white',
    fontSize: 14,
  },
  summaryDivider: {
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
    fontSize: 22,
    fontWeight: '700',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
  },
  orderButtonDisabled: {
    opacity: 0.7,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },

  // Success
  successOverlay: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${zamgasTheme.colors.semantic.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 26,
    fontWeight: '700',
  },
  successSubtitle: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 16,
    marginTop: 4,
  },
  successDetails: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successText: {
    color: 'white',
    fontSize: 15,
    flex: 1,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 28,
    width: '100%',
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
})
