import { useState, useEffect } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'

// Complete auth session for web browsers
WebBrowser.maybeCompleteAuthSession()

// Get client IDs from environment
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ''
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ''
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''

export interface GoogleUser {
    id: string
    email: string
    name: string
    photo?: string
    idToken?: string
}

export function useGoogleAuth() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<GoogleUser | null>(null)

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: WEB_CLIENT_ID,
        androidClientId: ANDROID_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        scopes: ['profile', 'email'],
    })

    useEffect(() => {
        handleAuthResponse()
    }, [response])

    const handleAuthResponse = async () => {
        if (response?.type !== 'success') {
            if (response?.type === 'error') {
                setError(response.error?.message || 'Authentication failed')
            }
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const { authentication } = response

            if (!authentication?.accessToken) {
                throw new Error('No access token received')
            }

            // Fetch user info from Google
            const userInfoResponse = await fetch(
                'https://www.googleapis.com/userinfo/v2/me',
                {
                    headers: { Authorization: `Bearer ${authentication.accessToken}` },
                }
            )

            if (!userInfoResponse.ok) {
                throw new Error('Failed to fetch user info')
            }

            const googleUser = await userInfoResponse.json()

            setUser({
                id: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                photo: googleUser.picture,
                idToken: authentication.idToken,
            })

            return {
                user: googleUser,
                accessToken: authentication.accessToken,
                idToken: authentication.idToken,
            }
        } catch (err: any) {
            setError(err.message || 'Failed to authenticate')
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const signIn = async () => {
        setError(null)

        if (!request) {
            setError('Google Sign-In is not configured. Please add OAuth client IDs.')
            return null
        }

        try {
            const result = await promptAsync()

            if (result.type === 'success') {
                // Response will be handled by useEffect
                return result
            } else if (result.type === 'cancel') {
                setError('Sign-in was cancelled')
            }

            return null
        } catch (err: any) {
            setError(err.message || 'Sign-in failed')
            return null
        }
    }

    const signOut = () => {
        setUser(null)
        setError(null)
    }

    return {
        user,
        isLoading,
        error,
        isConfigured: !!WEB_CLIENT_ID || !!ANDROID_CLIENT_ID || !!IOS_CLIENT_ID,
        signIn,
        signOut,
        request,
    }
}
