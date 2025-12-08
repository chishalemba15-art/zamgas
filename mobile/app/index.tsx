import { useEffect } from 'react'
import { router, Redirect } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuthStore } from '@/lib/authStore'
import { zamgasTheme } from '@/lib/theme'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={zamgasTheme.colors.premium.gold} />
      </View>
    )
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/signin" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
  },
})
