import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    neutral: 'badge-neutral',
  }

  return <span className={cn('badge', variantClasses[variant], className)}>{children}</span>
}
