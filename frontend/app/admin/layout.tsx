import type { Metadata } from 'next'
import { AdminLayout } from '@/components/admin/AdminLayout'

export const metadata: Metadata = {
  title: 'Admin Dashboard - ZamGas',
  description: 'ZamGas LPG Delivery Admin Panel',
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
