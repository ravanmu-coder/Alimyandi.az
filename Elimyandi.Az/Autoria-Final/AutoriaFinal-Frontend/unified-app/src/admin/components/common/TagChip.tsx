import { X } from 'lucide-react'

interface TagChipProps {
  label: string
  onRemove?: () => void
  variant?: 'default' | 'primary' | 'secondary'
  size?: 'sm' | 'md'
  className?: string
}

export function TagChip({ 
  label, 
  onRemove, 
  variant = 'default', 
  size = 'md', 
  className = '' 
}: TagChipProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    secondary: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 hover:bg-black/10 rounded-full p-0.5 transition-colors duration-200"
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
