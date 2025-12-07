import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Sign In - ZamGas',
  description: 'ZamGas LPG Delivery Admin Sign In',
}

export default function AdminSignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Don't use AdminLayout for signin page - just render children directly
  return <>{children}</>
}
