import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  className?: string
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className = '' 
}: KPICardProps) {
  return (
    <div className={`bg-dark-bg-tertiary rounded-lg border border-dark-border p-6 hover:bg-dark-bg-quaternary transition-all duration-200 group ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-accent-primary/10 rounded-lg group-hover:bg-accent-primary/20 transition-colors duration-200">
          <Icon className="w-6 h-6 text-accent-primary" />
        </div>
        {trend && (
          <div className={`text-body-sm font-medium ${
            trend.isPositive ? 'text-accent-success' : 'text-accent-error'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-h3 font-heading font-bold text-dark-text-primary">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="text-body-sm text-dark-text-secondary">{title}</p>
        {subtitle && (
          <p className="text-body-xs text-dark-text-muted">{subtitle}</p>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 pt-4 border-t border-dark-border">
          <p className="text-body-xs text-dark-text-muted">
            {trend.label}
          </p>
        </div>
      )}
    </div>
  )
}
