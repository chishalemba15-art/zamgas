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
} from 'react-native'
import { router } from 'expo-router'
import { Zap, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'

export default function SignUpScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+260')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { setAuth } = useAuthStore()

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.register({
        name: name.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        password,
        user_type: 'customer',
      })
      
      if (response.token && response.user) {
        await setAuth(response.user, response.token)
        router.replace('/(tabs)')
      } else {
        Alert.alert('Success', 'Account created! Please sign in.')
        router.push('/(auth)/signin')
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again')
    } finally {
      setIsLoading(false)
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
            <Zap size={40} color={zamgasTheme.colors.premium.burgundy} />
          </View>
          <Text style={styles.logoText}>ZAMGAS</Text>
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitleText}>Join Lusaka's #1 LPG delivery</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <User size={20} color={zamgasTheme.colors.premium.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={zamgasTheme.colors.premium.gray}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Phone size={20} color={zamgasTheme.colors.premium.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+260 97X XXX XXX"
              placeholderTextColor={zamgasTheme.colors.premium.gray}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={zamgasTheme.colors.premium.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
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

          {/* Sign Up Button */}
          <TouchableOpacity 
            style={[styles.signUpButton, isLoading && styles.buttonDisabled]} 
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Zap size={20} color="white" />
                <Text style={styles.signUpButtonText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    marginBottom: zamgasTheme.spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: zamgasTheme.colors.premium.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: zamgasTheme.spacing.sm,
    ...zamgasTheme.shadows.gold,
  },
  logoText: {
    fontSize: zamgasTheme.typography.sizes['2xl'],
    fontWeight: '700',
    color: zamgasTheme.colors.premium.gold,
  },
  headerContainer: {
    marginBottom: zamgasTheme.spacing.xl,
  },
  welcomeText: {
    fontSize: zamgasTheme.typography.sizes['2xl'],
    fontWeight: '700',
    color: zamgasTheme.colors.premium.gold,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: zamgasTheme.typography.sizes.base,
    color: zamgasTheme.colors.premium.gray,
    textAlign: 'center',
    marginTop: zamgasTheme.spacing.xs,
  },
  formContainer: {
    gap: zamgasTheme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
    paddingHorizontal: zamgasTheme.spacing.base,
    height: 52,
  },
  inputIcon: {
    marginRight: zamgasTheme.spacing.sm,
  },
  input: {
    flex: 1,
    color: zamgasTheme.colors.neutral.white,
    fontSize: zamgasTheme.typography.sizes.base,
  },
  eyeIcon: {
    padding: zamgasTheme.spacing.xs,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: zamgasTheme.borderRadius.xl,
    height: 52,
    gap: zamgasTheme.spacing.sm,
    marginTop: zamgasTheme.spacing.sm,
    ...zamgasTheme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: zamgasTheme.typography.sizes.md,
    fontWeight: '700',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: zamgasTheme.spacing.lg,
  },
  signInText: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: zamgasTheme.typography.sizes.base,
  },
  signInLink: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: zamgasTheme.typography.sizes.base,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: zamgasTheme.colors.premium.gray,
    fontSize: zamgasTheme.typography.sizes.sm,
    marginTop: zamgasTheme.spacing['2xl'],
  },
})
