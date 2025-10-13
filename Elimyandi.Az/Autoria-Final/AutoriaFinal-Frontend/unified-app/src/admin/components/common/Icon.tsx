import { LucideIcon } from 'lucide-react'

interface IconProps {
  icon: LucideIcon
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: string
}

export function Icon({ 
  icon: IconComponent, 
  size = 'md', 
  className = '', 
  color 
}: IconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  const style = color ? { color } : {}

  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${className}`} 
      style={style}
    />
  )
}
