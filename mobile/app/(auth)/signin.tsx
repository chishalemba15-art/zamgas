import { useState } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { router } from 'expo-router'
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'
import { authAPI, setAuthToken } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { useGoogleAuth } from '@/lib/useGoogleAuth'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.zamgas.com'

export default function SignInScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { setAuth } = useAuthStore()
  const { signIn: googleSignIn, isLoading: isGoogleLoading, isConfigured: isGoogleConfigured } = useGoogleAuth()

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.login(email.trim(), password)
      
      if (response.token && response.user) {
        await setAuth(response.user, response.token)
        router.replace('/(tabs)')
      } else {
        Alert.alert('Error', 'Invalid response from server')
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn()
      
      if (result?.type === 'success') {
        // The useGoogleAuth hook will handle getting the user info
        // Now we need to authenticate with our backend
        const authentication = result.authentication
        
        if (authentication?.idToken) {
          // Send the Google ID token to your backend
          const response = await fetch(`${API_URL}/auth/google/mobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_token: authentication.idToken,
              access_token: authentication.accessToken,
            }),
          })

          const data = await response.json()

          if (response.ok && data.token && data.user) {
            await setAuth(data.user, data.token)
            router.replace('/(tabs)')
          } else {
            Alert.alert('Error', data.error || 'Failed to authenticate with Google')
          }
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      Alert.alert('Google Sign-In Failed', error.message || 'Please try again')
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Zap size={48} color={zamgasTheme.colors.premium.burgundy} />
          </View>
          <Text style={styles.logoText}>ZAMGAS</Text>
          <Text style={styles.tagline}>Order LPG gas in 60 seconds</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={20} color={zamgasTheme.colors.premium.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={zamgasTheme.colors.premium.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={zamgasTheme.colors.premium.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={zamgasTheme.colors.premium.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? (
                <EyeOff size={20} color={zamgasTheme.colors.premium.gray} />
              ) : (
                <Eye size={20} color={zamgasTheme.colors.premium.gray} />
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity 
            style={[styles.signInButton, isLoading && styles.buttonDisabled]} 
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Zap size={20} color="white" />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity 
            style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]} 
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading || !isGoogleConfigured}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                {/* Google Logo SVG as View */}
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>
                  {isGoogleConfigured ? 'Continue with Google' : 'Google Sign-In (Not Configured)'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>🔥 Fast • Safe • Reliable LPG Delivery</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: zamgasTheme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: zamgasTheme.spacing['2xl'],
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: zamgasTheme.colors.premium.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: zamgasTheme.spacing.md,
    ...zamgasTheme.shadows.gold,
  },
  logoText: {
    fontSize: zamgasTheme.typography.sizes['3xl'],
    fontFamily: zamgasTheme.typography.fontFamily.display,
    color: zamgasTheme.colors.premium.gold,
    fontWeight: '700',
  },
  tagline: {
    fontSize: zamgasTheme.typography.sizes.sm,
    color: zamgasTheme.colors.premium.gray,
    marginTop: zamgasTheme.spacing.xs,
  },
  headerContainer: {
    marginBottom: zamgasTheme.spacing['2xl'],
  },
  welcomeText: {
    fontSize: zamgasTheme.typography.sizes['2xl'],
    fontWeight: '700',
    color: zamgasTheme.colors.premium.gold,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: zamgasTheme.typography.sizes.md,
    color: zamgasTheme.colors.premium.gray,
    textAlign: 'center',
    marginTop: zamgasTheme.spacing.xs,
  },
  formContainer: {
    gap: zamgasTheme.spacing.base,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
    paddingHorizontal: zamgasTheme.spacing.base,
    height: 56,
  },
  inputIcon: {
    marginRight: zamgasTheme.spacing.sm,
  },
  input: {
    flex: 1,
    color: zamgasTheme.colors.neutral.white,
    fontSize: zamgasTheme.typography.sizes.md,
  },
  eyeIcon: {
    padding: zamgasTheme.spacing.xs,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: zamgasTheme.borderRadius.xl,
    height: 56,
    gap: zamgasTheme.spacing.sm,
    marginTop: zamgasTheme.spacing.md,
    ...zamgasTheme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: zamgasTheme.typography.sizes.lg,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: zamgasTheme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
  },
  dividerText: {
    color: zamgasTheme.colors.premium.gray,
    paddingHorizontal: zamgasTheme.spacing.md,
    fontSize: zamgasTheme.typography.sizes.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: zamgasTheme.borderRadius.xl,
    height: 56,
    gap: zamgasTheme.spacing.sm,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#333333',
    fontSize: zamgasTheme.typography.sizes.base,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: zamgasTheme.spacing.xl,
  },
  signUpText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: zamgasTheme.typography.sizes.base,
  },
  signUpLink: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: zamgasTheme.typography.sizes.base,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: zamgasTheme.colors.premium.gray,
    fontSize: zamgasTheme.typography.sizes.sm,
    marginTop: zamgasTheme.spacing['3xl'],
  },
})
