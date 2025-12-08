import { Tabs } from 'expo-router'
import { View, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Zap, Package, User, MessageCircle } from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  
  // Calculate proper bottom padding for Android nav bar
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom
  const tabBarHeight = 60 + bottomPadding

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: zamgasTheme.colors.premium.gold,
        tabBarInactiveTintColor: zamgasTheme.colors.premium.gray,
        tabBarStyle: {
          backgroundColor: zamgasTheme.colors.premium.burgundy,
          borderTopColor: zamgasTheme.colors.premium.burgundyLight,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Order Gas',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Zap size={20} color={color} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Package size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <User size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Help',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <MessageCircle size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: `${zamgasTheme.colors.premium.gold}20`,
  },
})
