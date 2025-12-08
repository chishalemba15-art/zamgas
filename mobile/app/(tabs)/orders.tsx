import { useState, useEffect, useCallback } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Package, Truck, CheckCircle, Clock, XCircle, Phone, MapPin } from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'
import { orderAPI, Order } from '@/lib/api'

const STATUS_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  pending: { emoji: '⏳', color: zamgasTheme.colors.semantic.warning, label: 'Processing' },
  accepted: { emoji: '✓', color: zamgasTheme.colors.premium.gold, label: 'Confirmed' },
  'in-transit': { emoji: '🚚', color: zamgasTheme.colors.semantic.info, label: 'On the Way' },
  delivered: { emoji: '✅', color: zamgasTheme.colors.semantic.success, label: 'Delivered' },
  cancelled: { emoji: '❌', color: zamgasTheme.colors.semantic.danger, label: 'Cancelled' },
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadOrders = async () => {
    try {
      const data = await orderAPI.getUserOrders()
      // Sort by date descending
      const sorted = (data || []).sort((a: Order, b: Order) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
      setOrders(sorted)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders()
    }, [])
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={zamgasTheme.colors.premium.gold} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} total orders</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); loadOrders() }}
            tintColor={zamgasTheme.colors.premium.gold}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={zamgasTheme.colors.premium.burgundyLight} />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>Your order history will appear here</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const isActive = ['pending', 'accepted', 'in-transit'].includes(order.status)

              return (
                <View 
                  key={order.id} 
                  style={[
                    styles.orderCard,
                    isActive && styles.orderCardActive,
                  ]}
                >
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                    <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>

                  {/* Order Details */}
                  <View style={styles.orderDetails}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderType}>{order.cylinder_type} × {order.quantity}</Text>
                      <Text style={styles.orderId}>#{order.id.slice(0, 6)}</Text>
                    </View>

                    <View style={styles.orderMeta}>
                      <Clock size={14} color={zamgasTheme.colors.premium.gray} />
                      <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    </View>

                    {order.delivery_address && (
                      <View style={styles.orderMeta}>
                        <MapPin size={14} color={zamgasTheme.colors.premium.gray} />
                        <Text style={styles.orderAddress} numberOfLines={1}>
                          {order.delivery_address}
                        </Text>
                      </View>
                    )}

                    {/* Provider Info */}
                    {order.provider && (
                      <View style={styles.providerRow}>
                        <View style={styles.providerInfo}>
                          <Text style={styles.providerLabel}>Provider:</Text>
                          <Text style={styles.providerName}>{order.provider.name}</Text>
                        </View>
                      </View>
                    )}

                    {/* Courier Contact - Show for in-transit */}
                    {order.status === 'in-transit' && order.courier && (
                      <TouchableOpacity style={styles.courierRow}>
                        <Truck size={16} color={zamgasTheme.colors.premium.gold} />
                        <Text style={styles.courierText}>Courier: {order.courier.name}</Text>
                        <Phone size={14} color={zamgasTheme.colors.premium.gold} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Total */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>K{order.grand_total || order.total_amount || '-'}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

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
  loadingText: {
    marginTop: 16,
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
  },
  header: {
    padding: zamgasTheme.spacing.base,
    paddingBottom: zamgasTheme.spacing.md,
  },
  headerTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  ordersList: {
    padding: zamgasTheme.spacing.base,
    gap: 12,
  },
  orderCard: {
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  orderCardActive: {
    borderColor: zamgasTheme.colors.premium.gold,
    borderWidth: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  statusEmoji: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderType: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 18,
    fontWeight: '700',
  },
  orderId: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
  },
  orderAddress: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
    flex: 1,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 12,
  },
  providerName: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 12,
    fontWeight: '600',
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${zamgasTheme.colors.premium.gold}15`,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  courierText: {
    flex: 1,
    color: zamgasTheme.colors.premium.gold,
    fontSize: 13,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: zamgasTheme.colors.premium.burgundyLight,
  },
  totalLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
  },
  totalValue: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
    marginTop: 8,
  },
})
