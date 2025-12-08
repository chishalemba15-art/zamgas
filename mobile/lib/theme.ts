/**
 * ZAMGAS Mobile Theme
 * Premium Dark Theme with Burgundy & Gold accents
 * Ported from web frontend/lib/zamgas-theme.ts
 */

export const zamgasTheme = {
    colors: {
        // Premium Dark Theme (Primary)
        premium: {
            burgundy: '#260606',
            burgundyDark: '#1a0404',
            burgundyLight: '#3D1515',
            red: '#8B0000',
            redDark: '#600000',
            gold: '#FBC609',
            goldDark: '#D4A600',
            gray: '#A0A0A0',
        },

        // Semantic colors
        semantic: {
            success: '#22c55e',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
        },

        // Neutral colors
        neutral: {
            white: '#FFFFFF',
            black: '#000000',
            gray100: '#f5f5f5',
            gray200: '#e5e5e5',
            gray300: '#d4d4d4',
            gray400: '#a3a3a3',
            gray500: '#737373',
            gray600: '#525252',
            gray700: '#404040',
            gray800: '#262626',
            gray900: '#171717',
        },
    },

    typography: {
        fontFamily: {
            display: 'Inter_700Bold',
            body: 'Inter_400Regular',
            medium: 'Inter_500Medium',
            semibold: 'Inter_600SemiBold',
        },
        sizes: {
            xs: 10,
            sm: 12,
            base: 14,
            md: 16,
            lg: 18,
            xl: 20,
            '2xl': 24,
            '3xl': 30,
            '4xl': 36,
        },
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        base: 16,
        lg: 20,
        xl: 24,
        '2xl': 32,
        '3xl': 48,
    },

    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        '2xl': 20,
        '3xl': 24,
        full: 9999,
    },

    shadows: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        medium: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        large: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
        gold: {
            shadowColor: '#FBC609',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
        },
    },
}

export type Theme = typeof zamgasTheme
