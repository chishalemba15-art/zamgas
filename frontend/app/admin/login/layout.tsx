import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Login - ZamGas',
  description: 'ZamGas LPG Delivery Admin Login',
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Don't use AdminLayout for login page - just render children directly
  return <>{children}</>
}
