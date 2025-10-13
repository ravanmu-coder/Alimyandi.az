import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200'
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  )
}

// Pre-built skeleton components
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <Skeleton height={200} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton height={20} width="80%" />
        <Skeleton height={16} width="60%" />
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton height={14} width={100} />
        </div>
        <Skeleton height={32} width="100%" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-3 text-left">
                  <Skeleton height={12} width={80} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <Skeleton height={16} width={colIndex === 0 ? 120 : 80} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 5, className = '' }: { 
  items?: number
  className?: string 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
          <Skeleton height={24} width={80} />
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4, className = '' }: { 
  fields?: number
  className?: string 
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton height={14} width={100} className="mb-2" />
          <Skeleton height={40} width="100%" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton({ cards = 4, className = '' }: { 
  cards?: number
  className?: string 
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton height={14} width={80} className="mb-2" />
              <Skeleton height={32} width={120} className="mb-2" />
              <Skeleton height={12} width={100} />
            </div>
            <Skeleton variant="circular" width={48} height={48} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DrawerSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton height={24} width={150} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      
      <Skeleton height={200} width="100%" className="mb-6" />
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton height={12} width={60} className="mb-1" />
            <Skeleton height={16} width={80} />
          </div>
          <div>
            <Skeleton height={12} width={60} className="mb-1" />
            <Skeleton height={16} width={80} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton height={12} width={60} className="mb-1" />
            <Skeleton height={16} width={80} />
          </div>
          <div>
            <Skeleton height={12} width={60} className="mb-1" />
            <Skeleton height={16} width={80} />
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-3">
        <Skeleton height={40} width="100%" />
        <Skeleton height={40} width="100%" />
      </div>
    </div>
  )
}

export function ModalSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <Skeleton height={24} width={200} className="mb-2" />
          <Skeleton height={14} width={150} />
        </div>
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      
      {/* Body */}
      <div className="p-6">
        <div className="space-y-4">
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="80%" />
          <Skeleton height={16} width="90%" />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
        <Skeleton height={36} width={80} />
        <Skeleton height={36} width={120} />
      </div>
    </div>
  )
}
