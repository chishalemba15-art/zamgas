import { Metadata } from 'next'

// Page-specific SEO metadata
export const homeMetadata: Metadata = {
    title: 'ZAMGAS - LPG Delivery in Lusaka | Order Cooking Gas Online',
    description: 'Never queue for gas again! Order LPG cylinders online in Lusaka and get same-day delivery. 6kg to 48kg cylinders. Pay via Mobile Money or Cash.',
    keywords: ['LPG delivery Lusaka', 'cooking gas Zambia', 'order gas online', 'gas cylinder delivery'],
}

export const signInMetadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your ZAMGAS account to order LPG gas delivery in Lusaka.',
}

export const signUpMetadata: Metadata = {
    title: 'Create Account - Start Ordering Gas',
    description: 'Create a free ZAMGAS account and start ordering LPG gas cylinders delivered to your doorstep in Lusaka.',
}

export const dashboardMetadata: Metadata = {
    title: 'Order Gas | Dashboard',
    description: 'Order LPG gas cylinders for delivery. Choose from 6kg, 9kg, 15kg, 22.5kg, or 48kg cylinders.',
}

export const ordersMetadata: Metadata = {
    title: 'My Orders',
    description: 'Track your LPG gas orders and view delivery history.',
}

export const supportMetadata: Metadata = {
    title: 'Support & Help',
    description: 'Get help with your ZAMGAS orders. Contact customer support for LPG delivery issues.',
}

// Common meta helpers
export function generatePageMetadata(
    title: string,
    description: string,
    path: string = ''
): Metadata {
    return {
        title,
        description,
        alternates: {
            canonical: `https://www.zamgas.com${path}`,
        },
        openGraph: {
            title: `${title} | ZAMGAS`,
            description,
            url: `https://www.zamgas.com${path}`,
        },
    }
}
