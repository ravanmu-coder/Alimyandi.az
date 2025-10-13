
interface LoadingSkeletonProps {
  className?: string
  height?: string
  width?: string
  variant?: 'text' | 'rectangular' | 'circular'
}

export function LoadingSkeleton({ 
  className = '', 
  height = '1rem', 
  width = '100%',
  variant = 'rectangular'
}: LoadingSkeletonProps) {
  const baseClasses = 'skeleton'
  
  const variantClasses = {
    text: 'h-4',
    rectangular: '',
    circular: 'rounded-full'
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ height, width }}
      aria-label="Loading..."
    />
  )
}

// Pre-built skeleton components
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <LoadingSkeleton key={i} height="1.5rem" width="120px" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton key={colIndex} height="1rem" width="100px" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <LoadingSkeleton height="200px" width="100%" className="mb-4" />
          <LoadingSkeleton height="1.5rem" width="80%" className="mb-2" />
          <LoadingSkeleton height="1rem" width="60%" className="mb-4" />
          <div className="flex justify-between items-center">
            <LoadingSkeleton height="1rem" width="100px" />
            <LoadingSkeleton height="2rem" width="80px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function KPICardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-center justify-between mb-4">
            <LoadingSkeleton height="2rem" width="2rem" variant="circular" />
            <LoadingSkeleton height="1rem" width="60px" />
          </div>
          <LoadingSkeleton height="2rem" width="80px" className="mb-2" />
          <LoadingSkeleton height="1rem" width="120px" />
        </div>
      ))}
    </div>
  )
}
