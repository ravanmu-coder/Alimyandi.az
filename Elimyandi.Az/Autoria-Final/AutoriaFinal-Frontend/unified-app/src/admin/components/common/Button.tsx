import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-body font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'
  
  const variantClasses = {
    primary: 'bg-accent-primary text-white hover:bg-accent-primary/90 focus:ring-accent-primary/50',
    secondary: 'bg-dark-bg-tertiary text-dark-text-primary border border-dark-border hover:bg-dark-bg-quaternary focus:ring-accent-primary/50',
    ghost: 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:text-dark-text-primary focus:ring-accent-primary/50',
    danger: 'bg-accent-error text-white hover:bg-accent-error/90 focus:ring-accent-error/50'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-body-sm',
    md: 'px-4 py-2 text-body-md',
    lg: 'px-6 py-3 text-body-lg'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const isDisabled = disabled || loading

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className={`${iconSizeClasses[size]} ${children ? 'mr-2' : ''}`} />
      )}
      
      {children}
      
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className={`${iconSizeClasses[size]} ${children ? 'ml-2' : ''}`} />
      )}
    </button>
  )
}
