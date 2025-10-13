
interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

export function Avatar({ 
  src, 
  alt = 'Avatar', 
  size = 'md', 
  fallback, 
  className = '' 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  }

  const baseClasses = 'inline-flex items-center justify-center bg-gray-200 text-gray-700 font-medium rounded-full overflow-hidden'

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${baseClasses} ${sizeClasses[size]} ${className}`}
        onError={(e) => {
          // Fallback to placeholder if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const fallbackElement = target.nextElementSibling as HTMLElement
          if (fallbackElement) {
            fallbackElement.style.display = 'flex'
          }
        }}
      />
    )
  }

  return (
    <div className={`${baseClasses} ${sizeClasses[size]} ${className}`}>
      {fallback ? (
        fallback.substring(0, 2).toUpperCase()
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white">
          <span>?</span>
        </div>
      )}
    </div>
  )
}
