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
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { 
  Zap, 
  MapPin, 
  Star, 
  Minus, 
  Plus, 
  Truck,
  CheckCircle,
  Package,
  Navigation,
  MapPinned,
  User,
} from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'
import { useAuthStore } from '@/lib/authStore'
import { providerAPI, orderAPI, preferencesAPI, userAPI, Provider, Order } from '@/lib/api'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const MAP_HEIGHT = SCREEN_HEIGHT * 0.48
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.54

// Cylinder sizes
const CYLINDER_SIZES = [
  { size: '6KG', price: 85 },
  { size: '9KG', price: 120 },
  { size: '13KG', price: 180 },
  { size: '19KG', price: 290 },
]

// Demo providers for when API has no nearby providers
const DEMO_PROVIDERS = [
  { id: 'demo-1', name: 'ORYX Energy', rating: 4.8, latitude: -15.4150, longitude: 28.2850 },
  { id: 'demo-2', name: 'Total Energies', rating: 4.6, latitude: -15.4200, longitude: 28.2780 },
  { id: 'demo-3', name: 'Puma Energy', rating: 4.5, latitude: -15.4100, longitude: 28.2900 },
]

export default function DashboardScreen() {
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdering, setIsOrdering] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  
  // Map & Provider
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const mapRef = useRef<MapView>(null)
  
  // Location
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [locationAddress, setLocationAddress] = useState('')
  
  // Order form
  const [selectedCylinder, setSelectedCylinder] = useState(CYLINDER_SIZES[2])
  const [quantity, setQuantity] = useState(1)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current
  const markerAnims = useRef(DEMO_PROVIDERS.map(() => new Animated.Value(0))).current

  // Default location (Lusaka)
  const [region, setRegion] = useState({
    latitude: -15.4167,
    longitude: 28.2833,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/signin')
      return
    }
    checkLocationPermission()
    startPulseAnimation()
  }, [isAuthenticated])

  useEffect(() => {
    if (userLocation) {
      loadDashboardData()
      animateMarkers()
    }
  }, [userLocation])

  // Pulse animation for user marker
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  // Animate markers appearing
  const animateMarkers = () => {
    markerAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: index * 150,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start()
    })
  }

  const checkLocationPermission = async () => {
    try {
      const hasGranted = await AsyncStorage.getItem('locationPermissionGranted')
      
      if (!hasGranted) {
        setShowLocationModal(true)
        setIsLoading(false)
      } else {
        await getCurrentLocation()
      }
    } catch (error) {
      console.error('Permission check error:', error)
      setIsLoading(false)
    }
  }

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location to find nearby providers')
        setIsLoading(false)
        return
      }

      await AsyncStorage.setItem('locationPermissionGranted', 'true')

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
      
      setUserLocation(coords)
      setRegion({
        ...coords,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      })

      // Reverse geocode
      try {
        const [address] = await Location.reverseGeocodeAsync(coords)
        if (address) {
          const formattedAddress = [
            address.street,
            address.district || address.subregion,
            address.city,
          ].filter(Boolean).join(', ')
          
          setLocationAddress(formattedAddress)
          setDeliveryAddress(formattedAddress)
        }
      } catch {}

      // Update server
      try {
        await userAPI.updateLocation(coords.latitude, coords.longitude)
        updateUser({ latitude: coords.latitude, longitude: coords.longitude })
      } catch {}

    } catch (error) {
      console.error('Location error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationPermission = async () => {
    setShowLocationModal(false)
    setIsLoading(true)
    await getCurrentLocation()
  }

  const loadDashboardData = async () => {
    try {
      const providersData = await providerAPI.getAll()
      
      let displayProviders: Provider[] = []
      
      if (providersData && providersData.length > 0) {
        displayProviders = providersData
      } else if (userLocation) {
        // Use demo providers around user location
        displayProviders = DEMO_PROVIDERS.map((p, i) => ({
          ...p,
          latitude: userLocation.latitude + (Math.random() - 0.5) * 0.02,
          longitude: userLocation.longitude + (Math.random() - 0.5) * 0.02,
        })) as Provider[]
      }
      
      setProviders(displayProviders)
      
      if (displayProviders.length > 0) {
        // Select nearest
        let nearest = displayProviders[0]
        if (userLocation) {
          let minDist = Infinity
          displayProviders.forEach((p) => {
            if (p.latitude && p.longitude) {
              const dist = Math.sqrt(
                Math.pow(p.latitude - userLocation.latitude, 2) +
                Math.pow(p.longitude - userLocation.longitude, 2)
              )
              if (dist < minDist) {
                minDist = dist
                nearest = p
              }
            }
          })
        }
        setSelectedProvider(nearest)
        
        // Fit map to show user and providers
        if (mapRef.current && userLocation) {
          const coords = [
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            ...displayProviders.slice(0, 3).map(p => ({
              latitude: p.latitude || 0,
              longitude: p.longitude || 0,
            })),
          ]
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
          })
        }
      }
      
      // Active orders
      try {
        const orders = await orderAPI.getUserOrders()
        const active = orders?.find((o: Order) => ['pending', 'accepted', 'in-transit'].includes(o.status))
        setActiveOrder(active || null)
      } catch {}

      // Preferences
      try {
        const prefs = await preferencesAPI.get()
        if (prefs?.preferences) {
          if (prefs.preferences.preferred_cylinder_type) {
            const found = CYLINDER_SIZES.find(c => c.size === prefs.preferences.preferred_cylinder_type)
            if (found) setSelectedCylinder(found)
          }
          if (prefs.preferences.saved_delivery_address && !deliveryAddress) {
            setDeliveryAddress(prefs.preferences.saved_delivery_address)
          }
        }
      } catch {}
    } catch (error) {
      console.error('Dashboard load error:', error)
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
      await orderAPI.create({
        provider_id: selectedProvider.id,
        cylinder_type: selectedCylinder.size,
        quantity,
        delivery_address: deliveryAddress.trim(),
        delivery_method: 'home_delivery',
        payment_method: paymentMethod === 'cash' ? 'cash' : 'mobile_money',
      })

      await preferencesAPI.upsert({
        preferred_cylinder_type: selectedCylinder.size,
        preferred_provider_id: selectedProvider.id,
        saved_delivery_address: deliveryAddress.trim(),
      }).catch(() => {})

      setShowSuccess(true)
      // Shorter notification - 2.5 seconds
      setTimeout(() => {
        setShowSuccess(false)
        loadDashboardData()
      }, 2500)
      
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Please try again')
    } finally {
      setIsOrdering(false)
    }
  }

  const totalPrice = selectedCylinder.price * quantity
  const deliveryFee = 20
  const grandTotal = totalPrice + deliveryFee

  // Location Modal
  if (showLocationModal) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MapPinned size={40} color={zamgasTheme.colors.premium.gold} />
            </View>
            <Text style={styles.modalTitle}>Enable Location</Text>
            <Text style={styles.modalText}>
              Find LPG providers near you and get gas delivered to your doorstep.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleLocationPermission}>
              <MapPin size={18} color="white" />
              <Text style={styles.modalButtonText}>Allow Location</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalSkip}
              onPress={() => {
                setShowLocationModal(false)
                setIsLoading(false)
                // Use default location
                setUserLocation({ latitude: -15.4167, longitude: 28.2833 })
              }}
            >
              <Text style={styles.modalSkipText}>Use default location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Zap size={36} color={zamgasTheme.colors.premium.burgundy} />
        </View>
        <Text style={styles.loadingText}>Finding providers...</Text>
        <ActivityIndicator size="small" color={zamgasTheme.colors.premium.gold} style={{ marginTop: 12 }} />
      </View>
    )
  }

  // Success Screen - shorter duration
  if (showSuccess) {
    return (
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <CheckCircle size={56} color={zamgasTheme.colors.semantic.success} />
          </View>
          <Text style={styles.successTitle}>Order Placed! 🔥</Text>
          <Text style={styles.successSubtitle}>Delivery in 30-60 mins</Text>
          
          <View style={styles.successDetails}>
            <View style={styles.successRow}>
              <Package size={16} color={zamgasTheme.colors.premium.gold} />
              <Text style={styles.successText}>{selectedCylinder.size} × {quantity} = K{grandTotal}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => {
              setShowSuccess(false)
              router.push('/(tabs)/orders')
            }}
          >
            <Navigation size={16} color="white" />
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          region={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          customMapStyle={darkMapStyle}
        >
          {/* User Location Marker with pulse */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={200}
                fillColor={`${zamgasTheme.colors.premium.gold}15`}
                strokeColor={`${zamgasTheme.colors.premium.gold}40`}
                strokeWidth={1}
              />
              <Marker coordinate={userLocation}>
                <View style={styles.userMarkerContainer}>
                  <Animated.View style={[styles.userMarkerPulse, { transform: [{ scale: pulseAnim }] }]} />
                  <View style={styles.userMarkerInner}>
                    <User size={14} color="white" />
                  </View>
                </View>
              </Marker>
            </>
          )}

          {/* Provider Markers with animation */}
          {providers.slice(0, 5).map((provider, index) => (
            provider.latitude && provider.longitude && (
              <Marker
                key={provider.id}
                coordinate={{
                  latitude: provider.latitude,
                  longitude: provider.longitude,
                }}
                onPress={() => setSelectedProvider(provider)}
              >
                <Animated.View 
                  style={[
                    styles.providerMarkerOuter,
                    selectedProvider?.id === provider.id && styles.providerMarkerSelected,
                    {
                      transform: [
                        { scale: markerAnims[index] || new Animated.Value(1) },
                      ],
                    },
                  ]}
                >
                  <View style={[
                    styles.providerMarkerInner,
                    selectedProvider?.id === provider.id && styles.providerMarkerInnerSelected,
                  ]}>
                    <Zap 
                      size={12} 
                      color={selectedProvider?.id === provider.id ? zamgasTheme.colors.premium.burgundy : 'white'} 
                      fill={selectedProvider?.id === provider.id ? zamgasTheme.colors.premium.burgundy : 'transparent'}
                    />
                  </View>
                </Animated.View>
              </Marker>
            )
          ))}
        </MapView>

        {/* Header */}
        <SafeAreaView style={styles.mapOverlay} edges={['top']}>
          <View style={styles.mapHeader}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.logoImage}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>Hi, {user?.name?.split(' ')[0]} 👋</Text>
              <Text style={styles.taglineText} numberOfLines={1}>{locationAddress || 'Lusaka, Zambia'}</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Active Order - shorter display */}
        {activeOrder && (
          <TouchableOpacity 
            style={styles.activeOrderBanner}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={styles.pulse} />
            <Truck size={16} color={zamgasTheme.colors.premium.gold} />
            <Text style={styles.activeOrderText}>
              {activeOrder.status === 'in-transit' ? 'En Route' : 'Processing'}
            </Text>
            <Text style={styles.activeOrderLink}>Track →</Text>
          </TouchableOpacity>
        )}

        {/* Provider Chip */}
        {selectedProvider && (
          <View style={styles.providerChip}>
            <Zap size={12} color={zamgasTheme.colors.premium.gold} />
            <Text style={styles.providerChipName}>{selectedProvider.name}</Text>
            {selectedProvider.rating && (
              <View style={styles.ratingChip}>
                <Star size={9} color={zamgasTheme.colors.premium.gold} fill={zamgasTheme.colors.premium.gold} />
                <Text style={styles.ratingText}>{selectedProvider.rating}</Text>
              </View>
            )}
          </View>
        )}

        {/* Provider count badge */}
        <View style={styles.providerCountBadge}>
          <Text style={styles.providerCountText}>{providers.length} providers nearby</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.handleBar} />
        
        <ScrollView 
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Cylinder Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Size</Text>
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
          </View>

          {/* Quantity + Address */}
          <View style={styles.rowSection}>
            <View style={styles.qtySection}>
              <Text style={styles.sectionTitle}>Qty</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity 
                  style={styles.qtyBtn}
                  onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                >
                  <Minus size={16} color={quantity <= 1 ? zamgasTheme.colors.premium.gray : 'white'} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Plus size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.addressSection}>
              <Text style={styles.sectionTitle}>Deliver to</Text>
              <View style={styles.addressInput}>
                <MapPin size={14} color={zamgasTheme.colors.premium.gold} />
                <TextInput
                  style={styles.addressText}
                  placeholder="Enter address..."
                  placeholderTextColor={zamgasTheme.colors.premium.gray}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  numberOfLines={1}
                />
              </View>
            </View>
          </View>

          {/* Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity
                style={[styles.paymentChip, paymentMethod === 'cash' && styles.paymentChipActive]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Text style={styles.paymentEmoji}>💵</Text>
                <Text style={[styles.paymentLabel, paymentMethod === 'cash' && styles.paymentLabelActive]}>Cash</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.paymentChip, paymentMethod === 'mtn' && styles.paymentChipActive]}
                onPress={() => setPaymentMethod('mtn')}
              >
                <Image source={require('@/assets/images/mtn_money.png')} style={styles.paymentIcon} />
                <Text style={[styles.paymentLabel, paymentMethod === 'mtn' && styles.paymentLabelActive]}>MTN</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.paymentChip, paymentMethod === 'airtel' && styles.paymentChipActive]}
                onPress={() => setPaymentMethod('airtel')}
              >
                <View style={[styles.paymentIconPlaceholder, { backgroundColor: '#ED1C24' }]}>
                  <Text style={styles.paymentIconText}>A</Text>
                </View>
                <Text style={[styles.paymentLabel, paymentMethod === 'airtel' && styles.paymentLabelActive]}>Airtel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.paymentChip, paymentMethod === 'zamtel' && styles.paymentChipActive]}
                onPress={() => setPaymentMethod('zamtel')}
              >
                <View style={[styles.paymentIconPlaceholder, { backgroundColor: '#00A651' }]}>
                  <Text style={styles.paymentIconText}>Z</Text>
                </View>
                <Text style={[styles.paymentLabel, paymentMethod === 'zamtel' && styles.paymentLabelActive]}>Zamtel</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Button */}
          <View style={styles.orderRow}>
            <View style={styles.totalCol}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>K{grandTotal}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.orderButton, isOrdering && styles.orderButtonDisabled]}
              onPress={handlePlaceOrder}
              disabled={isOrdering}
            >
              {isOrdering ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Zap size={18} color="white" fill="white" />
                  <Text style={styles.orderButtonText}>Order Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8c8c8c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: zamgasTheme.colors.premium.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${zamgasTheme.colors.premium.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 22,
    fontWeight: '700',
  },
  modalText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 24,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSkip: {
    marginTop: 16,
  },
  modalSkipText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 13,
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
    padding: 14,
    gap: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  welcomeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  taglineText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 11,
  },

  // User Marker
  userMarkerContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${zamgasTheme.colors.premium.gold}30`,
  },
  userMarkerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: zamgasTheme.colors.premium.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },

  // Provider Markers
  providerMarkerOuter: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerMarkerSelected: {
    transform: [{ scale: 1.2 }],
  },
  providerMarkerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: zamgasTheme.colors.premium.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  providerMarkerInnerSelected: {
    backgroundColor: zamgasTheme.colors.premium.gold,
  },
  
  activeOrderBanner: {
    position: 'absolute',
    bottom: 56,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: zamgasTheme.colors.premium.gold,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: zamgasTheme.colors.semantic.success,
  },
  activeOrderText: {
    flex: 1,
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  activeOrderLink: {
    color: zamgasTheme.colors.premium.gold,
    fontWeight: '600',
    fontSize: 12,
  },
  providerChip: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  providerChipName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: zamgasTheme.colors.premium.gold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: zamgasTheme.colors.premium.burgundy,
    fontSize: 10,
    fontWeight: '700',
  },
  providerCountBadge: {
    position: 'absolute',
    top: 80,
    right: 14,
    backgroundColor: `${zamgasTheme.colors.premium.burgundy}CC`,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  providerCountText: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 11,
    fontWeight: '600',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 14,
  },

  // Sections
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  
  // Cylinders
  cylinderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cylinderPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  cylinderPillActive: {
    backgroundColor: zamgasTheme.colors.premium.red,
    borderColor: zamgasTheme.colors.premium.gold,
  },
  cylinderSize: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  cylinderSizeActive: {
    color: zamgasTheme.colors.premium.gold,
  },
  cylinderPrice: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 11,
  },
  cylinderPriceActive: {
    color: 'white',
  },

  // Quantity + Address
  rowSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  qtySection: {
    width: 100,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  addressSection: {
    flex: 1,
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  addressText: {
    flex: 1,
    color: 'white',
    fontSize: 12,
  },

  // Payment
  paymentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  paymentChipActive: {
    borderColor: zamgasTheme.colors.premium.gold,
    backgroundColor: `${zamgasTheme.colors.premium.gold}15`,
  },
  paymentEmoji: {
    fontSize: 18,
  },
  paymentIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  paymentIconPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  paymentLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  paymentLabelActive: {
    color: zamgasTheme.colors.premium.gold,
  },

  // Order Row
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
  totalCol: {
    marginRight: 16,
  },
  totalLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 11,
  },
  totalValue: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 22,
    fontWeight: '700',
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: 10,
    paddingVertical: 14,
  },
  orderButtonDisabled: {
    opacity: 0.7,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },

  // Success
  successOverlay: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${zamgasTheme.colors.semantic.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 24,
    fontWeight: '700',
  },
  successSubtitle: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
    marginTop: 4,
  },
  successDetails: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successText: {
    color: 'white',
    fontSize: 13,
    flex: 1,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 24,
    width: '100%',
  },
  trackButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
})
