import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

// SEO Metadata - Comprehensive
export const metadata: Metadata = {
  // Basic
  title: {
    default: 'ZAMGAS - LPG Delivery in Lusaka | Order Cooking Gas Online',
    template: '%s | ZAMGAS Zambia',
  },
  description: 'Order LPG gas cylinders online in Lusaka, Zambia. Same-day delivery to your doorstep. 6kg, 9kg, 15kg, 22.5kg, 48kg cylinders. Pay via Mobile Money or Cash. Safe, fast, reliable cooking gas delivery.',
  
  // Keywords for LPG/Gas delivery in Zambia
  keywords: [
    'LPG delivery Lusaka',
    'gas cylinder delivery Zambia',
    'cooking gas Lusaka',
    'order gas online Zambia',
    'LPG supplier Lusaka',
    'gas cylinder refill',
    'cooking gas delivery',
    'ZAMGAS',
    'mobile gas delivery',
    'home gas delivery Lusaka',
    'LP gas Zambia',
    'propane delivery Lusaka',
    '6kg gas cylinder',
    '9kg gas cylinder',
    '15kg gas cylinder',
    '48kg gas cylinder',
    'gas delivery app Zambia',
    'same day gas delivery',
    'affordable LPG Lusaka',
  ],
  
  // Authors and creator
  authors: [{ name: 'ZAMGAS', url: 'https://www.zamgas.com' }],
  creator: 'ZAMGAS Zambia',
  publisher: 'ZAMGAS',
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_ZM',
    url: 'https://www.zamgas.com',
    siteName: 'ZAMGAS',
    title: 'ZAMGAS - Order LPG Gas Online | Lusaka Delivery',
    description: 'Never queue for gas again! Order cooking gas cylinders online and get same-day delivery across Lusaka. Safe, fast, affordable LPG delivery service.',
    images: [
      {
        url: 'https://www.zamgas.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ZAMGAS - LPG Delivery Service in Lusaka, Zambia',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'ZAMGAS - Order LPG Gas Online | Lusaka Delivery',
    description: 'Never queue for gas again! Same-day LPG delivery across Lusaka. Order in 60 seconds.',
    images: ['https://www.zamgas.com/og-image.png'],
    creator: '@zamgas_zm',
  },
  
  // Canonical
  alternates: {
    canonical: 'https://www.zamgas.com',
  },
  
  // App configuration
  applicationName: 'ZAMGAS',
  referrer: 'origin-when-cross-origin',
  
  // Icons
  icons: {
    icon: '/app-icon.png',
    shortcut: '/app-icon.png',
    apple: '/app-icon.png',
  },
  
  // Manifest
  manifest: '/manifest.json',
  
  // Category
  category: 'energy',
  
  // Verification (add your codes when you have them)
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-code',
    // yahoo: 'your-yahoo-code',
  },
  
  // Other
  other: {
    'geo.region': 'ZM-09',
    'geo.placename': 'Lusaka',
    'geo.position': '-15.4167;28.2833',
    'ICBM': '-15.4167, 28.2833',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

// Viewport configuration (separated as per Next.js 14)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#260606' },
    { media: '(prefers-color-scheme: dark)', color: '#260606' },
  ],
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // Organization
    {
      '@type': 'Organization',
      '@id': 'https://www.zamgas.com/#organization',
      name: 'ZAMGAS',
      url: 'https://www.zamgas.com',
      logo: 'https://www.zamgas.com/app-icon.png',
      description: 'Lusaka\'s premier on-demand LPG delivery service. Order cooking gas online and get same-day delivery.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Lusaka',
        addressRegion: 'Lusaka Province',
        addressCountry: 'ZM',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+260-97-900-0000',
        contactType: 'customer service',
        availableLanguage: ['English'],
      },
      sameAs: [
        'https://www.facebook.com/zamgas',
        'https://twitter.com/zamgas_zm',
        'https://www.instagram.com/zamgas_zm',
      ],
    },
    // LocalBusiness
    {
      '@type': 'LocalBusiness',
      '@id': 'https://www.zamgas.com/#business',
      name: 'ZAMGAS - LPG Delivery',
      image: 'https://www.zamgas.com/app-icon.png',
      description: 'On-demand LPG gas cylinder delivery service in Lusaka, Zambia',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Lusaka',
        addressLocality: 'Lusaka',
        addressRegion: 'Lusaka Province',
        postalCode: '10101',
        addressCountry: 'ZM',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -15.4167,
        longitude: 28.2833,
      },
      telephone: '+260979000000',
      priceRange: 'K100-K500',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '06:00',
          closes: '22:00',
        },
      ],
      areaServed: {
        '@type': 'City',
        name: 'Lusaka',
      },
    },
    // Service
    {
      '@type': 'Service',
      '@id': 'https://www.zamgas.com/#service',
      name: 'LPG Gas Cylinder Delivery',
      provider: {
        '@id': 'https://www.zamgas.com/#organization',
      },
      serviceType: 'LPG Delivery',
      description: 'Same-day delivery of LPG cooking gas cylinders to homes and businesses in Lusaka',
      areaServed: {
        '@type': 'City',
        name: 'Lusaka',
        '@id': 'https://www.wikidata.org/wiki/Q3856',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'LPG Cylinder Sizes',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '6kg LPG Cylinder' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '9kg LPG Cylinder' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '15kg LPG Cylinder' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '22.5kg LPG Cylinder' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '48kg LPG Cylinder' } },
        ],
      },
    },
    // WebSite with SearchAction
    {
      '@type': 'WebSite',
      '@id': 'https://www.zamgas.com/#website',
      url: 'https://www.zamgas.com',
      name: 'ZAMGAS',
      description: 'Order LPG gas online in Lusaka',
      publisher: {
        '@id': 'https://www.zamgas.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.zamgas.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    // FAQPage
    {
      '@type': 'FAQPage',
      '@id': 'https://www.zamgas.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How fast is ZAMGAS delivery?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We deliver LPG gas cylinders within 2-3 hours across Lusaka. Same-day delivery is guaranteed for orders placed before 6 PM.',
          },
        },
        {
          '@type': 'Question',
          name: 'What cylinder sizes does ZAMGAS offer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ZAMGAS offers 6kg, 9kg, 15kg, 22.5kg, and 48kg LPG cylinders for residential and commercial use.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I pay for my gas delivery?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can pay via Mobile Money (MTN, Airtel, Zamtel) or Cash on Delivery. All payments are secure and instant.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is ZAMGAS available in my area?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ZAMGAS currently serves all areas within Lusaka including Kabulonga, Chilenje, Roma, Woodlands, and surrounding areas.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17895305109"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17895305109');
          `}
        </Script>
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://api.zamgas.com" />
      </head>
      <body className={`${inter.variable} ${outfit.variable}`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#260606',
              color: '#FBC609',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
              borderRadius: '0.75rem',
              padding: '16px',
              border: '1px solid #3D1515',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
