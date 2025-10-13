import React from 'react'

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export function Badge({ 
  variant = 'neutral', 
  size = 'md', 
  children, 
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-body font-medium rounded-full'
  
  const variantClasses = {
    success: 'bg-accent-success/10 text-accent-success border border-accent-success/20',
    danger: 'bg-accent-error/10 text-accent-error border border-accent-error/20',
    warning: 'bg-accent-warning/10 text-accent-warning border border-accent-warning/20',
    info: 'bg-accent-info/10 text-accent-info border border-accent-info/20',
    neutral: 'bg-dark-bg-tertiary text-dark-text-secondary border border-dark-border'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-body-xs',
    md: 'px-3 py-1 text-body-sm'
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  )
}

// Status-specific badge components
export function StatusBadge({ 
  status, 
  children 
}: { 
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'
  children?: React.ReactNode
}) {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Active' },
    inactive: { variant: 'neutral' as const, label: 'Inactive' },
    pending: { variant: 'warning' as const, label: 'Pending' },
    completed: { variant: 'success' as const, label: 'Completed' },
    cancelled: { variant: 'danger' as const, label: 'Cancelled' }
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant}>
      {children || config.label}
    </Badge>
  )
}
