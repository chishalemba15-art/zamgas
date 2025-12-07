/**
 * ZAMGAS Clean Energy Design System
 * Fortune 500 Premium | Green Energy Focus | Sustainability First
 * Positioning LPG as the clean cooking fuel of choice
 */

export const zamgasTheme = {
  // Clean Energy Color Palette - Sophisticated & Sustainable
  colors: {
    // Primary: Forest Green (Trust, Growth, Sustainability)
    primary: {
      forest: '#0B6E4F',        // Deep forest green - main brand
      forestLight: '#08A05C',   // Lighter forest
      forestDark: '#084C3A',    // Darker forest
      mint: '#D8F3DC',          // Soft mint for backgrounds
      mintLight: '#F1FAEE',     // Very light mint
    },

    // Secondary: Warm Amber (Energy, Warmth, Comfort)
    secondary: {
      amber: '#FF9F1C',         // Warm amber for CTAs
      amberLight: '#FFBF69',    // Light amber
      amberDark: '#E67E00',     // Deep amber
      peach: '#FFF3E0',         // Soft peach background
    },

    // Accent: Teal (Clean, Fresh, Modern)
    accent: {
      teal: '#06D6A0',          // Vibrant teal for highlights
      tealLight: '#8CDEDC',     // Soft teal
      tealDark: '#04AA7D',      // Deep teal
      cyan: '#B8E6E1',          // Very light cyan
    },

    // Trust: Navy/Slate (Corporate, Professional, Fortune 500)
    trust: {
      navy: '#1A2F3A',          // Deep navy for headers
      slate: '#2C3E50',         // Slate for text
      slateLight: '#5D737E',    // Light slate
      steel: '#34495E',         // Steel gray
    },

    // Earth: Natural tones (Organic, Sustainable)
    earth: {
      sage: '#8BA888',          // Sage green
      clay: '#BC6C25',          // Earthy clay
      sand: '#FAF3E0',          // Sandy beige
      moss: '#5F7161',          // Moss green
    },

    // Neutrals: Cool grays with blue tint (Clean, Professional)
    neutral: {
      white: '#FFFFFF',
      50: '#F9FAFB',              // Whisper gray
      100: '#F3F4F6',             // Cloud gray
      200: '#E5E7EB',             // Silver
      300: '#D1D5DB',             // Light gray
      400: '#9CA3AF',             // Gray
      500: '#6B7280',             // Slate
      600: '#4B5563',             // Charcoal
      700: '#374151',             // Dark slate
      800: '#1F2937',             // Almost black
      900: '#111827',             // Rich black
      black: '#000000',
      // Legacy compatibility
      '100-57': 'rgba(255, 255, 255, 0.57)',
      10: '#F9FAFB',
      40: '#E5E7EB',
    },

    // Semantic: Purpose-Driven Colors
    semantic: {
      textPrimary: '#1F2937',     // Dark slate for readability
      textSecondary: '#6B7280',   // Slate for hierarchy
      textTertiary: '#9CA3AF',    // Light gray for subtle text
      background: '#F9FAFB',      // Whisper gray background
      cardBg: '#FFFFFF',          // Pure white cards
      border: '#E5E7EB',          // Silver borders
      success: '#10B981',         // Eco green - success
      info: '#0EA5E9',            // Sky blue - information
      warning: '#F59E0B',         // Gold - caution
      danger: '#EF4444',          // Clean red - alerts
      eco: '#059669',             // Deep green - environmental
    },

    // Environmental Impact Colors
    impact: {
      co2Saved: '#10B981',        // Green for CO2 reduction
      treesPlanted: '#059669',    // Forest green
      cleanAir: '#0EA5E9',        // Sky blue
      renewable: '#6EE7B7',       // Mint for sustainability
    },
  },

  // Eco-Conscious Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #047857 0%, #10B981 50%, #6EE7B7 100%)',     // Forest to mint
    primarySubtle: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',           // Subtle green
    eco: 'linear-gradient(135deg, #10B981 0%, #06D6A0 100%)',                     // Vibrant eco
    corporate: 'linear-gradient(135deg, #1E3A8A 0%, #0EA5E9 100%)',               // Navy to sky
    earth: 'linear-gradient(135deg, #52796F 0%, #84A98C 100%)',                   // Olive to sage
    premium: 'linear-gradient(135deg, #047857 0%, #0284C7 100%)',                 // Green to blue
    accent: 'linear-gradient(135deg, #FFBF69 0%, #FFF3E0 100%)',                  // Warm amber to peach
    background: 'linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)',              // Whisper to white
    cardGlow: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 214, 160, 0.05) 100%)',
    impact: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 50%, #6EE7B7 100%)',     // Environmental
  },

  // Refined Corporate Shadows
  shadows: {
    none: 'none',
    soft: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    small: '0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
    large: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
    xlarge: '0 12px 32px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.08)',
    hover: '0 6px 20px rgba(16, 185, 129, 0.15), 0 3px 8px rgba(0, 0, 0, 0.08)',
    ecoGlow: '0 4px 24px rgba(16, 185, 129, 0.3)',
    amberGlow: '0 4px 24px rgba(255, 159, 28, 0.3)',
    goldGlow: '0 4px 24px rgba(255, 191, 105, 0.3)',
    innerGlow: 'inset 0 1px 3px rgba(255, 255, 255, 0.15)',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    small: '8px',
    medium: '12px',
    large: '16px',
    xlarge: '20px',
    xxlarge: '24px',
    full: '9999px',
  },

  // Spacing Scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
  },

  // Enhanced Typography System
  typography: {
    fontFamily: {
      display: "var(--font-outfit, 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif)",
      body: "var(--font-inter, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
}

// Animation keyframes (for use in CSS or styled components)
export const zamgasAnimations = {
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  slideInFromLeft: `
    @keyframes slideInFromLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  slideInFromRight: `
    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `,
  bounce: `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `,
  drawLine: `
    @keyframes drawLine {
      from {
        stroke-dashoffset: 1000;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
  `,
}

// CSS classes for ZAMGAS Clean Energy patterns
export const zamgasClasses = {
  // Cards
  card: `bg-white rounded-2xl shadow-[0_2px_8px_rgba(26,47,58,0.08)] transition-all duration-300 hover:shadow-[0_6px_24px_rgba(11,110,79,0.15)] hover:-translate-y-1`,

  // Eco-featured card
  cardEco: `bg-gradient-to-br from-[#0B6E4F] to-[#08A05C] text-white rounded-2xl shadow-[0_4px_16px_rgba(11,110,79,0.2)] transition-all duration-300 hover:shadow-[0_6px_24px_rgba(11,110,79,0.3)] hover:-translate-y-1`,

  // Energy card
  cardEnergy: `bg-gradient-to-br from-[#FF9F1C] to-[#FFBF69] text-white rounded-2xl shadow-[0_4px_16px_rgba(255,159,28,0.2)] transition-all duration-300 hover:-translate-y-1`,

  // Buttons
  buttonPrimary: `bg-[#0B6E4F] text-white font-semibold py-4 px-6 rounded-xl shadow-[0_4px_16px_rgba(11,110,79,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(11,110,79,0.3)] active:translate-y-0`,

  buttonEnergy: `bg-[#FF9F1C] text-white font-semibold py-4 px-6 rounded-xl shadow-[0_4px_16px_rgba(255,159,28,0.2)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0`,

  buttonSecondary: `bg-[#1A2F3A] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:-translate-y-1`,

  buttonOutline: `bg-white text-[#0B6E4F] border-2 border-[#0B6E4F] font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#D8F3DC]`,

  // Badges
  badgeEco: `bg-[#06D6A0] text-white px-3 py-1 rounded-full text-xs font-semibold`,
  badgeEnergy: `bg-[#FF9F1C] text-white px-3 py-1 rounded-full text-xs font-semibold`,
  badgePending: `bg-[#FF9F1C] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase`,
  badgeCompleted: `bg-[#06D6A0] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase`,
  badgeCancelled: `bg-[#E53E3E] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase`,

  // Headers
  headerGradient: `bg-gradient-to-br from-[#084C3A] via-[#0B6E4F] to-[#08A05C] text-white p-5 pb-8 rounded-b-3xl`,

  // Location selector
  locationSelector: `flex items-center gap-2 bg-[rgba(255,255,255,0.9)] backdrop-blur-md p-2.5 px-4 rounded-xl border border-[rgba(11,110,79,0.2)]`,

  // Icons containers
  iconContainerEco: `w-12 h-12 bg-[#06D6A0] rounded-xl flex items-center justify-center text-2xl`,
  iconContainerEnergy: `w-12 h-12 bg-[#FF9F1C] rounded-xl flex items-center justify-center text-2xl`,
  iconCircle: `w-12 h-12 bg-[#0B6E4F] rounded-full flex items-center justify-center`,
}

// Helper function to generate staggered animation delays
export const getStaggerDelay = (index: number, baseDelay: number = 0.1): string => {
  return `${baseDelay * index}s`
}

// Helper to create animated list items
export const getAnimatedClass = (index: number, animation: 'fadeIn' | 'slideInFromLeft' | 'slideInFromRight' = 'fadeIn'): string => {
  const animationName = animation
  const delay = getStaggerDelay(index + 1)
  return `animate-[${animationName}_0.5s_ease-out_${delay}_backwards]`
}

export default zamgasTheme
