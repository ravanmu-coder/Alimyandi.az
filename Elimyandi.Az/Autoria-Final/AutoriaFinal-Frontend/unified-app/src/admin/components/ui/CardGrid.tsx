import { Eye, Heart, Calendar, MapPin } from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { CardSkeleton } from '../common/LoadingSkeleton'
import { EmptyCardGridState } from '../common/EmptyState'

interface CardGridProps<T> {
  data: T[] | null
  loading?: boolean
  onItemClick?: (item: T) => void
  onWatch?: (item: T) => void
  onFavorite?: (item: T) => void
  className?: string
}

interface VehicleItem {
  id: string
  title: string
  vin: string
  status: 'active' | 'inactive' | 'pending' | 'sold'
  price: number
  location: string
  date: string
  image?: string
}

export function CardGrid<T extends VehicleItem>({
  data,
  loading = false,
  onItemClick,
  onWatch,
  onFavorite,
  className = ''
}: CardGridProps<T>) {
  if (loading || data === null) {
    return <CardSkeleton count={6} />
  }

  if (data.length === 0) {
    return <EmptyCardGridState />
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {data.map((item) => (
        <div
          key={item.id}
          className="card-premium group cursor-pointer"
          onClick={() => onItemClick?.(item)}
        >
          {/* Image */}
          <div className="relative mb-4">
            <div className="w-full h-48 bg-midnight-200 rounded-xl flex items-center justify-center">
              <div className="text-midnight-400 text-sm">Vehicle Image</div>
            </div>
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                icon={Heart}
                className="bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onFavorite?.(item)
                }}
                disabled
              />
            </div>
            <div className="absolute top-3 left-3">
              <Badge variant="success">
                {item.status}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-midnight-900 mb-1 group-hover:text-electric-cobalt transition-colors duration-200">
                {item.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-midnight-500">
                <span className="bg-midnight-100 px-2 py-1 rounded-full text-xs font-mono">
                  {item.vin}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-midnight-600">
                <MapPin className="w-4 h-4" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-midnight-600">
                <Calendar className="w-4 h-4" />
                <span>{item.date}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-midnight-200">
              <div className="text-lg font-bold text-electric-cobalt">
                ${item.price.toLocaleString()}
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Eye}
                onClick={(e) => {
                  e.stopPropagation()
                  onWatch?.(item)
                }}
                disabled
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
