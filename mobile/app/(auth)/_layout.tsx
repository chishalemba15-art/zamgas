import { Stack } from 'expo-router'
import { zamgasTheme } from '@/lib/theme'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: zamgasTheme.colors.premium.burgundyDark },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
