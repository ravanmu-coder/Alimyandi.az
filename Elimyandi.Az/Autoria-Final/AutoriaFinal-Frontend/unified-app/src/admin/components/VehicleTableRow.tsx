import { Eye } from 'lucide-react'
import { Button } from './common/Button'
import { Badge } from './common/Badge'
import { useEnums, getEnumLabel, getEnumBadgeClasses } from '../../services/enumService'

interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  odometer: number
  odometerUnit: string
  condition: string
  damageType: string
  bodyStyle: string
  color: string
  ownerId: string
  ownerName?: string
  locationId: string
  locationName?: string
  status: string
  createdAt: string
  imagePath?: string
  imageUrls?: string[]
  description?: string
  price?: number
  // Auction info
  auctionId?: string
  auctionName?: string
  saleTime?: string
  nextSale?: string
  highlights?: string[]
  region?: string
}

interface VehicleTableRowProps {
  vehicle: Vehicle
  onViewDetails: (vehicleId: string) => void
}

export function VehicleTableRow({ vehicle, onViewDetails }: VehicleTableRowProps) {
  const { enums } = useEnums()

  const getStatusBadgeColor = (status: string) => {
    const badgeClasses = getEnumBadgeClasses('CarCondition', status)
    return badgeClasses
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Table image failed to load:', vehicle.imagePath)
    e.currentTarget.style.display = 'none'
    e.currentTarget.nextElementSibling?.classList.remove('hidden')
  }

  const handleImageLoad = () => {
    console.log('Table image loaded successfully:', vehicle.imagePath)
  }

  return (
    <tr className="hover:bg-dark-bg-tertiary transition-colors">
      {/* Image */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="w-12 h-8 sm:w-16 sm:h-12 bg-dark-bg-tertiary rounded-md overflow-hidden">
          {vehicle.imagePath ? (
            <img
              src={vehicle.imagePath}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : null}
          <div className={`w-full h-full bg-dark-bg-tertiary flex items-center justify-center ${vehicle.imagePath ? 'hidden' : ''}`}>
            <div className="text-xs text-dark-text-muted text-center">
              <div>No</div>
              <div>Image</div>
            </div>
          </div>
        </div>
      </td>

      {/* Sale Time */}
      <td className="px-6 py-4 text-sm text-dark-text-primary">
        {vehicle.saleTime ? new Date(vehicle.saleTime).toLocaleDateString() : 'TBD'}
      </td>

      {/* Sale Name */}
      <td className="px-6 py-4 text-sm text-dark-text-primary">
        {vehicle.auctionName || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      </td>

      {/* Region */}
      <td className="px-6 py-4 text-sm text-dark-text-primary">
        {vehicle.region}
      </td>

      {/* Highlights */}
      <td className="px-6 py-4 text-sm text-dark-text-primary">
        <div className="flex flex-wrap gap-1">
          {vehicle.highlights?.slice(0, 2).map((highlight, index) => (
            <Badge key={index} variant="info" size="sm">
              {highlight}
            </Badge>
          ))}
          {vehicle.highlights && vehicle.highlights.length > 2 && (
            <span className="text-xs text-dark-text-muted">+{vehicle.highlights.length - 2}</span>
          )}
        </div>
      </td>

      {/* Current Sale */}
      <td className="px-6 py-4 text-sm text-dark-text-primary">
        {vehicle.saleTime ? new Date(vehicle.saleTime).toLocaleDateString() : 'TBD'}
      </td>

      {/* Next Sale */}
      <td className="px-6 py-4 text-sm text-dark-text-primary">
        {vehicle.nextSale ? new Date(vehicle.nextSale).toLocaleDateString() : 'TBD'}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <Badge variant="neutral" size="sm">
          {getEnumLabel('CarCondition', vehicle.status, enums)}
        </Badge>
      </td>

      {/* Action */}
      <td className="px-6 py-4">
        <Button 
          variant="ghost"
          onClick={() => onViewDetails(vehicle.id)}
          icon={Eye}
          size="sm"
        >
          View Details
        </Button>
      </td>
    </tr>
  )
}