import { Eye, MapPin, User, Calendar, Gauge, Car, AlertTriangle, CheckCircle, Clock, DollarSign, Zap } from 'lucide-react'
import { Button } from './common/Button'
import { Badge } from './common/Badge'
import { apiClient } from '../services/apiClient'
import { useEnums, getEnumLabel, getEnumBadgeClasses } from '../../services/enumService'

interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  mileage: number // DTO-da Odometer -> Mileage
  mileageUnit: string
  price: number
  currency: string
  bodyStyle?: string
  color?: string
  hasKeys: boolean
  titleState?: string
  estimatedRetailValue?: number

  // ===== ENUM SAHƏLƏRİ (Number olmalıdır!) =====
  fuelType: number           // C# enum FuelType
  damageType: number         // C# enum DamageType
  transmission: number       // C# enum Transmission
  driveTrain: number         // C# enum DriveTrain
  carCondition: number       // C# enum CarCondition
  titleType: number          // C# enum TitleType
  secondaryDamage?: number   // C# enum DamageType? (nullable)

  // Media
  imagePath?: string // DTO-dan gələn əsas şəkil
  imageUrls?: string[] // DTO-da Images -> imageUrls

  // Owner & Location
  ownerId: string
  ownerName: string
  locationId?: string
  locationName: string

  // Status & Dates
  status: string
  createdAt: string
  updatedAtUtc?: string

  // Auction related
  auctionId?: string
  auctionName?: string
  lotNumber?: number
  reservePrice?: number
  startPrice?: number
}

interface VehicleCardProps {
  vehicle: Vehicle
  onViewDetails: (vehicleId: string) => void
}

export function VehicleCard({ vehicle, onViewDetails }: VehicleCardProps) {
  const { enums } = useEnums()

  const getConditionIcon = (carCondition: number) => {
    switch (carCondition) {
      case 1: return <CheckCircle className="w-4 h-4 text-green-500" /> // İşləyir və Sürülür
      case 2: return <CheckCircle className="w-4 h-4 text-blue-500" /> // Mühərrik Başlatma Proqramı
      case 3: return <CheckCircle className="w-4 h-4 text-blue-500" /> // Təkmilləşdirilmiş
      case 4: return <AlertTriangle className="w-4 h-4 text-red-500" /> // Stasionar
      default: return <Car className="w-4 h-4 text-gray-500" />
    }
  }

  const getConditionColor = (carCondition: number) => {
    switch (carCondition) {
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 3: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Card image failed to load:', vehicle.imagePath)
    e.currentTarget.style.display = 'none'
    const fallback = e.currentTarget.nextElementSibling as HTMLElement
    if (fallback) fallback.classList.remove('hidden')
  }

  const handleImageLoad = () => {
    console.log('Card image loaded successfully:', vehicle.imagePath)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="group bg-white dark:bg-dark-bg-tertiary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-dark-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-gray-100 dark:bg-dark-bg-quaternary overflow-hidden">
        {vehicle.imagePath ? (
          <img
            src={vehicle.imagePath}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : null}
        <div className={`absolute inset-0 bg-gray-100 dark:bg-dark-bg-quaternary flex items-center justify-center ${vehicle.imagePath ? 'hidden' : ''}`}>
          <div className="text-center text-gray-400 dark:text-dark-text-muted">
            <Car className="w-12 h-12 mx-auto mb-2" />
            <div className="text-sm font-medium">No Image</div>
            <div className="text-xs">Available</div>
          </div>
        </div>

        {/* Condition Badge */}
        <div className="absolute top-3 right-3">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getConditionColor(vehicle.carCondition)}`}>
            {getConditionIcon(vehicle.carCondition)}
            <span className="ml-1.5">{getEnumLabel('CarCondition', vehicle.carCondition)}</span>
          </div>
        </div>

        {/* Damage Type Badge */}
        {vehicle.damageType && vehicle.damageType !== 0 && (
          <div className="absolute top-3 left-3">
            <span className={getEnumBadgeClasses('DamageType', vehicle.damageType)}>
              {getEnumLabel('DamageType', vehicle.damageType)}
            </span>
          </div>
        )}

        {/* VIN Badge */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-black/70 text-white px-2 py-1 rounded-md text-xs font-mono">
            {vehicle.vin.slice(-8)}
          </div>
        </div>

        {/* Price Badge */}
        {vehicle.price && vehicle.price > 0 && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              {vehicle.price.toLocaleString()} {vehicle.currency}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-2 line-clamp-2">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        
        {/* Key Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Mileage */}
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wide">Mileage</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                {vehicle.mileage?.toLocaleString()} {vehicle.mileageUnit}
              </p>
            </div>
          </div>

          {/* Body Style */}
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wide">Body</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary truncate">
                {vehicle.bodyStyle || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Transmission:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                {getEnumLabel('Transmission', vehicle.transmission)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Fuel:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                {getEnumLabel('FuelType', vehicle.fuelType)}
              </span>
            </div>
          </div>
        </div>

        {/* Damage Info */}
        {vehicle.damageType && vehicle.damageType !== 0 && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Damage Report</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              {getEnumLabel('DamageType', vehicle.damageType)}
            </p>
          </div>
        )}

        {/* Auction Information */}
        {vehicle.auctionName && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Auction Info</span>
            </div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">{vehicle.auctionName}</p>
            {vehicle.lotNumber && (
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Lot #{vehicle.lotNumber}
              </p>
            )}
          </div>
        )}
        
        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-dark-text-secondary">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{vehicle.ownerName || 'Unknown Owner'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-dark-text-secondary">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{vehicle.locationName || 'Unknown Location'}</span>
          </div>
        </div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onViewDetails(vehicle.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          icon={Eye}
        >
          View Details
        </Button>
      </div>
    </div>
  )
}