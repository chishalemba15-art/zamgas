'use client'

import { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'

interface PermissionGateProps {
  permissions?: string | string[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = useAuthStore()

  // Super admins bypass permission checks
  if (isAdmin()) {
    return <>{children}</>
  }

  // If no specific permissions required, show children
  if (!permissions) {
    return <>{children}</>
  }

  // Check permissions
  const permArray = Array.isArray(permissions) ? permissions : [permissions]
  const hasAccess = requireAll ? hasAllPermissions(permArray) : hasAnyPermission(permArray)

  return <>{hasAccess ? children : fallback}</>
}
